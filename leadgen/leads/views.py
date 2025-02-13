# Standard Library Imports
import os
import re
import json
import logging
from datetime import datetime

# Third-Party Imports
import pandas as pd
import spacy  # For further NLP tasks if needed
import google.generativeai as genai
from dotenv import load_dotenv

# Django Imports
from django.shortcuts import render
from django.http import JsonResponse
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

# Django REST Framework Imports
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.serializers import ModelSerializer

# App-Specific Imports
from .models import Supplier, Lead, EmailCampaign, UploadedLead, EmailLog, EmailSettings
from .serializers import (
    SupplierSerializer,
    LeadSerializer,
    EmailCampaignSerializer,
    UploadedLeadSerializer,
    EmailSettingsSerializer,
    EmailLogSerializer
)
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
 

# ------------------------------------------------------------------------------
# Load environment variables and configure external APIs
# ------------------------------------------------------------------------------
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Configure logging
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------------------
# Chatbot View (accessible without further authentication)
# ------------------------------------------------------------------------------
class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Returns previously generated leads.
        (Modify this to fetch leads from a database if needed.)
        """
        sample_leads = [
            {
                "company_name": "Tech Solutions Ltd",
                "email": "contact@techsol.com",
                "phone": "123-456-7890",
                "address": "123 Silicon Valley"
            },
            {
                "company_name": "Green Energy Inc.",
                "email": "info@greenenergy.com",
                "phone": "987-654-3210",
                "address": "456 Eco Street"
            },
        ]
        return JsonResponse({"leads": sample_leads})

    def post(self, request):
        user_input = request.data.get("user_input", "").strip()
        conversation_context = request.data.get("context", {})
        active_lead = request.data.get("active_lead", None)  # Supplier info for lead generation
        # New fields for location and number of leads
        location = request.data.get("location", None)
        num_leads = request.data.get("num_leads", None)

        # Ensure at least one input is provided
        if not user_input and not active_lead:
            return JsonResponse({"error": "No input provided"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Received message: {user_input}")
        logger.info(f"Conversation Context: {conversation_context}")
        logger.info(f"Active Lead (Supplier Info): {active_lead}")
        if location:
            logger.info(f"Location: {location}")
        if num_leads:
            logger.info(f"Number of Leads: {num_leads}")

        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            logger.info("Initialized AI model: gemini-2.0-flash")
        except Exception as e:
            logger.error(f"Error initializing AI model: {e}")
            return JsonResponse({"error": "Failed to initialize AI model"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # If supplier info is provided, build a detailed prompt
        if active_lead:
            prompt = (
                f"Based on the following supplier information:\n\n"
                f"{active_lead}\n\n"
            )
            if location:
                prompt += f"Generate leads for the location: {location}.\n\n"
            if num_leads:
                prompt += f"Generate {num_leads} leads.\n\n"
            prompt += (
                f"Generate a JSON array of potential business leads. Each lead should include the following details in the specified order:\n"
                f"Company Name, Email, Phone, and Address.\n\n"
                f"Each lead should be formatted as follows:\n"
                f'[{{"company_name": "Example Inc.", "email": "example@email.com", '
                f'"phone": "1234567890", "address": "123 St."}}]\n\n'
                f"If unable to generate structured JSON, list leads in this format:\n"
                f"Company: Example Inc.\n"
                f"Email: example@email.com\n"
                f"Phone: 1234567890\n"
                f"Address: 123 St.\n\n"
                f"Provide only the required output, no extra text."
            )

            logger.info(f"Generated prompt for lead generation: {prompt}")
            try:
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                logger.info(f"AI response text: {response_text}")
            except Exception as e:
                logger.error(f"Error generating content with AI model: {e}")
                return JsonResponse({"error": "Failed to generate AI email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            try:
                leads = json.loads(response_text)
            except Exception as json_err:
                logger.error(f"Error parsing generated JSON: {json_err}")
                json_match = re.search(r'(\[.*\])', response_text, re.DOTALL)
                if json_match:
                    try:
                        leads = json.loads(json_match.group(1))
                    except Exception as e:
                        logger.error(f"Regex extraction failed: {e}")
                        leads = self.parse_text_list(response_text)
                else:
                    leads = self.parse_text_list(response_text)

            # Return generated leads, conversation context and a flag for save option
            return JsonResponse({
                "leads": leads,
                "context": conversation_context,
                "save_option": True
            })
        else:
            response = model.generate_content(user_input)
            return JsonResponse({
                "message": response.text.strip(),
                "context": conversation_context,
            })

    def parse_text_list(self, response_text):
        """
        Extracts leads from a plain text list format when AI fails to generate JSON.
        """
        leads = []
        lead_pattern = re.findall(
            r"Company:\s*(.*?)\nAddress:\s*(.*?)\nEmail:\s*(.*?)\nPhone:\s*(.*?)\n",
            response_text,
            re.DOTALL
        )
        for match in lead_pattern:
            leads.append({
                "company_name": match[0].strip(),
                "email": match[2].strip(),
                "phone": match[3].strip(),
                "address": match[1].strip(),
            })

        if not leads:
            return [{"error": "Failed to extract leads from AI response", "raw_response": response_text}]
        return leads


# ------------------------------------------------------------------------------
# File Upload and Retrieval Views (accessible without further authentication)
# ------------------------------------------------------------------------------
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_leads(request):
    if 'file' not in request.FILES:
        logger.error("No file provided in the request.")
        return Response({"error": "No file provided"}, status=400)

    file = request.FILES['file']
    logger.info(f"Received file: {file.name}")

    try:
        if file.name.endswith(('.xlsx', '.xls')):
            logger.info("Processing Excel file.")
            data = pd.read_excel(file)
        else:
            logger.info("Processing CSV file.")
            data = pd.read_csv(file)

        logger.info(f"Columns in uploaded file: {list(data.columns)}")
        data.columns = [col.strip().lower() for col in data.columns]
        required_columns = ['company_name', 'email', 'phone', 'address']
        missing_columns = [col for col in required_columns if col not in data.columns]

        if missing_columns:
            error_msg = f"Missing required column(s): {', '.join(missing_columns)}"
            logger.error(error_msg)
            return Response({"error": error_msg, "columns_found": list(data.columns)}, status=400)

        # Get the supplier for the logged-in user instead of a default supplier
        supplier = Supplier.objects.filter(user=request.user).first()
        if not supplier:
            logger.error("No supplier found for the logged-in user.")
            return Response({"error": "No supplier available for your account"}, status=400)

        for index, row in data.iterrows():
            lead_data = {
                'company_name': row['company_name'],
                'email': row['email'],
                'phone': row['phone'],
                'address': row['address'],
                'supplier': supplier.id,
            }
            lead_serializer = LeadSerializer(data=lead_data)
            if lead_serializer.is_valid():
                lead_serializer.save()
                logger.info(f"Lead saved: {lead_data}")
            else:
                logger.error(f"Validation error on row {index}: {lead_serializer.errors}")
                return Response({"error": f"Validation error on row {index}", "details": lead_serializer.errors}, status=400)

        return Response({"message": "Leads uploaded successfully!"}, status=200)

    except Exception as e:
        logger.exception(f"Failed to process the file: {str(e)}")
        return Response({"error": f"Failed to process the file: {str(e)}"}, status=400)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_uploaded_leads(request):
    leads = UploadedLead.objects.filter(user=request.user)
    serializer = UploadedLeadSerializer(leads, many=True)
    return Response(serializer.data)
    

# ------------------------------------------------------------------------------
# AI Email Generator View (accessible without further authentication)
# ------------------------------------------------------------------------------

def send_custom_email(user, subject, message, recipient_list):
    try:
        email_settings = EmailSettings.objects.get(user=user)
    except EmailSettings.DoesNotExist:
        raise Exception("Email settings not configured for user.")
    
    # Decrypt the stored password for SMTP login
    decrypted_password = email_settings.get_decrypted_password()

    msg = MIMEMultipart()
    msg['From'] = email_settings.email_host_user
    msg['To'] = recipient_list[0]  # Assuming one recipient for simplicity
    msg['Subject'] = subject
    msg.attach(MIMEText(message, 'plain'))
    
    try:
        server = smtplib.SMTP(email_settings.email_host, email_settings.email_port)
        if email_settings.email_use_tls:
            server.starttls()
        server.login(email_settings.email_host_user, decrypted_password)
        server.sendmail(email_settings.email_host_user, recipient_list, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        raise e


class AIEmailGeneratorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("DEBUG: Received POST request with data:", request.data)
        supplier_id = request.data.get("supplier_id")
        preview_mode = request.data.get("preview", False)
        # New: get the list of selected emails from the request (an array of email addresses)
        send_to = request.data.get("send_to", None)
        print("DEBUG: supplier_id =", supplier_id)
        print("DEBUG: preview_mode =", preview_mode)
        print("DEBUG: send_to =", send_to)

        if not supplier_id:
            print("DEBUG: No supplier_id provided")
            return JsonResponse({"error": "Supplier ID is required"}, status=400)

        try:
            supplier = Supplier.objects.get(id=supplier_id)
            print("DEBUG: Found supplier:", supplier)
        except Supplier.DoesNotExist:
            print("DEBUG: Supplier with id", supplier_id, "not found")
            return JsonResponse({"error": "Supplier not found"}, status=404)

        # Get all leads for the supplier
        leads = Lead.objects.filter(supplier=supplier)
        # If 'send_to' is provided, filter the leads to only those whose email is in send_to.
        if send_to:
            leads = leads.filter(email__in=send_to)
        
        print("DEBUG: Number of leads found:", leads.count())

        if not leads.exists():
            print("DEBUG: No leads found for supplier", supplier)
            return JsonResponse({"error": "No leads found for this supplier"}, status=404)

        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            print("DEBUG: Initialized AI model: gemini-2.0-flash")
        except Exception as e:
            print("DEBUG: Error initializing AI model:", e)
            return JsonResponse({"error": "Failed to initialize AI model"}, status=500)

        emails_generated = []
        for lead in leads:
            print("DEBUG: Generating email for lead:", lead)
                prompt = f"""
                    Generate a professional, concise, and persuasive sales email for {supplier.company_name} targeting {lead.company_name}. 
                    The email should include a separate subject line and a plain text email body without any markdown formatting or special symbols (like asterisks). 
                    Do not include the subject line in the email body.

                    Subject: {supplier.company_name} - Exclusive Business Opportunity!

                    Email Body:
                    Dear {lead.contact_name if hasattr(lead, 'contact_name') else 'Sir/Madam'},

                    I hope this email finds you well. I am {supplier.contact_name} from {supplier.company_name}. We specialize in {supplier.company_description} and believe that our expertise can bring significant value to your operations at {lead.company_name}.

                    I would like to discuss a potential collaboration at your convenience. Please feel free to reply to this email or contact me directly at {supplier.contact_phone}.

                    Best regards,
                    {supplier.contact_name}
                    {supplier.company_name}
                    Contact: {supplier.contact_phone}, {supplier.contact_email}
                    Website: {supplier.company_website}
                    """


            --- 

            **Instructions for AI:**  
            - Maintain a **formal, polished tone**.  
            - Use **markdown formatting** for structured readability.  
            - Ensure proper spacing, bullet points, and bold highlights for professionalism.  
            """

            print("DEBUG: Prompt for AI generation:", prompt)

            try:
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                print("DEBUG: AI response text:", response_text)
            except Exception as e:
                print("DEBUG: Error generating content with AI model:", e)
                return JsonResponse({"error": "Failed to generate AI email"}, status=500)

            subject_match = re.search(r"Subject:\s*(.*?)\n", response_text)
            body_match = re.search(r"Body:\s*(.*)", response_text, re.DOTALL)

            subject = subject_match.group(1) if subject_match else f"Business Collaboration with {supplier.company_name}"
            body = body_match.group(1) if body_match else response_text

            print("DEBUG: Parsed subject:", subject)
            print("DEBUG: Parsed body:", body)

            email_data = {
                "lead": lead.company_name,
                "email": lead.email,
                "subject": subject,
                "body": body,
            }

            if preview_mode:
                emails_generated.append(email_data)
            else:
                try:
                    send_custom_email(supplier.user, subject, body, [lead.email])
                    # Create an email log record for a sent email:
                    EmailLog.objects.create(
                        supplier=supplier,
                        lead=lead,
                        status="sent",
                        notes="Email sent successfully."
                    )
                    print("DEBUG: Email sent to:", lead.email)
                    emails_generated.append(email_data)
                except Exception as e:
                    EmailLog.objects.create(
                        supplier=supplier,
                        lead=lead,
                        status="failed",
                        notes=str(e)
                    )
                    print("DEBUG: Error sending email to", lead.email, ":", e)
                    return JsonResponse({"error": "Failed to send email"}, status=500)


        message = "Emails generated successfully!" if preview_mode else "Emails sent successfully!"
        print("DEBUG: Final message:", message)
        return JsonResponse({"message": message, "emails": emails_generated})


class EmailSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            email_settings = EmailSettings.objects.get(user=request.user)
            serializer = EmailSettingsSerializer(email_settings)
            return Response(serializer.data)
        except EmailSettings.DoesNotExist:
            return Response({"error": "Email settings not found"}, status=404)

    def post(self, request):
        # If email settings exist for user, update them. Otherwise, create new.
        email_settings, created = EmailSettings.objects.get_or_create(user=request.user)
        serializer = EmailSettingsSerializer(email_settings, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Email settings updated successfully!"})
        return Response(serializer.errors, status=400)


class EmailLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Optional: Filter logs by date if a query parameter is provided
        date_filter = request.query_params.get("date")  # expecting format 'YYYY-MM-DD'
        logs = EmailLog.objects.filter(supplier__user=request.user).order_by("-sent_at")
        if date_filter:
            logs = logs.filter(sent_at__date=date_filter)
        serializer = EmailLogSerializer(logs, many=True)
        return Response(serializer.data)

# ------------------------------------------------------------------------------
# User Authentication Views (Login & Registration)
# ------------------------------------------------------------------------------
class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                "username": user.username,
                "token": str(refresh.access_token)
            }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


class LeadDeleteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        lead = get_object_or_404(Lead, id=kwargs['id'], user=request.user)
        lead.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class RegisterView(APIView):
    def post(self, request):
        print("Received data:", request.data)
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            print("User created successfully!")
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        print("Validation failed:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------------------------------------------------------
# Model ViewSets (accessible without further authentication)
# ------------------------------------------------------------------------------
class SupplierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()  # Add this line

    def get_queryset(self):
        return Supplier.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        print(self.request.user)  # Debug: Check if user is authenticated
        if self.request.user.is_anonymous:
            raise ValueError("Authenticated user required to create a supplier.")
        serializer.save(user=self.request.user)


class LeadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadSerializer
    queryset = Lead.objects.all()  # Add this line

    def get_queryset(self):
        return Lead.objects.filter(supplier__user=self.request.user)


class EmailCampaignViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer

# ------------------------------------------------------------------------------
# Homepage View
# ------------------------------------------------------------------------------
def index(request):
    return render(request, 'index.html')    

