from rest_framework import viewsets
from .models import Supplier, Lead, EmailCampaign
from .serializers import SupplierSerializer, LeadSerializer, EmailCampaignSerializer
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import google.generativeai as genai
import logging
from datetime import datetime
import re
import os
from dotenv import load_dotenv
import spacy  # for further NLP tasks if needed
from rest_framework.permissions import AllowAny
from .models import UploadedLead
from .serializers import UploadedLeadSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from .models import Lead  # Ensure that Lead model is correctly defined in your models
import pandas as pd
import json
import re
from django.core.mail import send_mail


# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Configure logging
logger = logging.getLogger(__name__)

class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Returns previously generated leads.
        (Modify this to fetch leads from a database if needed.)
        """
        sample_leads = [
            {"company_name": "Tech Solutions Ltd", "address": "123 Silicon Valley", "email": "contact@techsol.com", "phone": "123-456-7890"},
            {"company_name": "Green Energy Inc.", "address": "456 Eco Street", "email": "info@greenenergy.com", "phone": "987-654-3210"},
        ]

        return JsonResponse({"leads": sample_leads})

    def post(self, request):
        user_input = request.data.get("user_input", "").strip()
        conversation_context = request.data.get("context", {})
        active_lead = request.data.get("active_lead", None)  # Supplier info for lead generation

        # Ensure at least one input is provided
        if not user_input and not active_lead:
            return JsonResponse({"error": "No input provided"}, status=400)

        # Log received data for debugging
        logger.info(f"Received message: {user_input}")
        logger.info(f"Conversation Context: {conversation_context}")
        logger.info(f"Active Lead (Supplier Info): {active_lead}")

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")

            # If active_lead data is provided, generate leads based on supplier information.
            if active_lead:
                # Craft a prompt instructing the model to output a JSON array of leads.
                prompt = (
                    f"Based on the following supplier information:\n\n"
                    f"{active_lead}\n\n"
                    f"Generate a JSON array of potential business leads."
                    f"Each lead should be formatted as: "
                    f'[{{"company_name": "Example Inc.", "address": "123 St.", "email": "example@email.com", "phone": "1234567890"}}]\n\n'
                    f"If unable to generate structured JSON, list leads in this format:\n"
                    f"Company: Example Inc.\nAddress: 123 St.\nEmail: example@email.com\nPhone: 1234567890\n\n"
                    f"Provide only the required output, no extra text."
                )

                logger.info(f"Generated prompt for lead generation: {prompt}")
                response = model.generate_content(prompt)
                response_text = response.text.strip()

                # Try to parse the response text as JSON
                try:
                    leads = json.loads(response_text)
                except Exception as json_err:
                    logger.error(f"Error parsing generated JSON: {json_err}")

                    # Attempt to extract JSON from the response using regex.
                    json_match = re.search(r'(\[.*\])', response_text, re.DOTALL)
                    if json_match:
                        try:
                            leads = json.loads(json_match.group(1))
                        except Exception as e:
                            logger.error(f"Regex extraction failed: {e}")
                            leads = self.parse_text_list(response_text)  # Fallback to list format
                    else:
                        leads = self.parse_text_list(response_text)  # Fallback to list format

                return JsonResponse({
                    "leads": leads,
                    "context": conversation_context,
                })

            # Otherwise, if only user_input is provided, do a regular conversation reply.
            else:
                response = model.generate_content(user_input)
                return JsonResponse({
                    "message": response.text.strip(),
                    "context": conversation_context,
                })

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return JsonResponse({"error": "Failed to generate response"}, status=500)

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
                "address": match[1].strip(),
                "email": match[2].strip(),
                "phone": match[3].strip(),
            })

        if not leads:
            return [{"error": "Failed to extract leads from AI response", "raw_response": response_text}]
        
        return leads


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
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

        # Debug: Log actual column names
        logger.info(f"Columns in uploaded file: {list(data.columns)}")

        # Standardizing column names (remove spaces, convert to lowercase)
        data.columns = [col.strip().lower() for col in data.columns]

        required_columns = ['company_name', 'email', 'phone','address']
        missing_columns = [col for col in required_columns if col not in data.columns]

        if missing_columns:
            error_msg = f"Missing required column(s): {', '.join(missing_columns)}"
            logger.error(error_msg)
            return Response({"error": error_msg, "columns_found": list(data.columns)}, status=400)

        # Get or create a default supplier
        default_supplier = Supplier.objects.first()
        if not default_supplier:
            logger.error("No default supplier found.")
            return Response({"error": "No supplier available in the database"}, status=400)

        # Process each row
        for index, row in data.iterrows():
            lead_data = {
                'company_name': row['company_name'],
                'email': row['email'],
                'phone': row['phone'],
                'address': row['address'],  
                'supplier': default_supplier.id,
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
def get_uploaded_leads(request):
    # Assuming you have a model and serializer for uploaded leads
    from .models import UploadedLead  # Ensure UploadedLead is defined in your models
    from .serializers import UploadedLeadSerializer  # Ensure UploadedLeadSerializer is defined

    leads = UploadedLead.objects.all()
    serializer = UploadedLeadSerializer(leads, many=True)
    return Response(serializer.data)

class AIEmailGeneratorView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Generate AI-powered sales emails for a supplier's leads.
        Supports preview mode to review emails before sending.
        """
        print("DEBUG: Received POST request with data:", request.data)
        supplier_id = request.data.get("supplier_id")
        preview_mode = request.data.get("preview", False)  # Default: send emails
        print("DEBUG: supplier_id =", supplier_id)
        print("DEBUG: preview_mode =", preview_mode)

        if not supplier_id:
            print("DEBUG: No supplier_id provided")
            return JsonResponse({"error": "Supplier ID is required"}, status=400)

        try:
            supplier = Supplier.objects.get(id=supplier_id)
            print("DEBUG: Found supplier:", supplier)
        except Supplier.DoesNotExist:
            print("DEBUG: Supplier with id", supplier_id, "not found")
            return JsonResponse({"error": "Supplier not found"}, status=404)

        leads = Lead.objects.filter(supplier=supplier)
        print("DEBUG: Number of leads found:", leads.count())

        if not leads.exists():
            print("DEBUG: No leads found for supplier", supplier)
            return JsonResponse({"error": "No leads found for this supplier"}, status=404)

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            print("DEBUG: Initialized AI model: gemini-1.5-flash")
        except Exception as e:
            print("DEBUG: Error initializing AI model:", e)
            return JsonResponse({"error": "Failed to initialize AI model"}, status=500)

        emails_generated = []
        for lead in leads:
            print("DEBUG: Generating email for lead:", lead)

            # Generate email content dynamically
            prompt = f"""
            Generate a highly professional sales email for {supplier.company_name} targeting {lead.company_name}.
            Ensure the email is well-structured, persuasive, and includes clear formatting.

            ### **Email Structure:**
            **Subject:** {supplier.company_name} - Exclusive Business Opportunity!

            **Body:**
            Dear {lead.contact_name if hasattr(lead, 'contact_name') else 'Sir/Madam'},

            I hope this email finds you well. I am {supplier.contact_name}, representing {supplier.company_name}.  
            We specialize in {supplier.company_description}, offering high-quality solutions tailored to your business needs.

            I wanted to personally reach out to explore a potential collaboration between {supplier.company_name} and {lead.company_name}.  
            We believe our expertise and products can bring significant value to your operations.

            ### **Why Choose Us?**
            ✔ **Trusted Supplier** - {supplier.company_name} is known for {supplier.company_description}.  
            ✔ **Competitive Pricing & Quality Assurance** - We ensure the best quality at the right price.  
            ✔ **Client-Centric Approach** - Our team is dedicated to providing the best solutions tailored to your needs.  

            I would love to discuss this further at your convenience.  
            You can reach me directly at **{supplier.contact_phone}** or reply to this email to schedule a call.

            Looking forward to the opportunity to collaborate.

            Best regards,  
            **{supplier.contact_name}**  
            {supplier.company_name}  
            📞 {supplier.contact_phone}  
            📧 {supplier.contact_email}  
            🌐 [Visit Our Website]({supplier.company_website})

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

            # Extract subject and body using regex
            subject_match = re.search(r"Subject:\s*(.*?)\n", response_text)
            body_match = re.search(r"Body:\s*(.*)", response_text, re.DOTALL)

            subject = subject_match.group(1) if subject_match else f"Business Collaboration with {supplier.company_name}"
            body = body_match.group(1) if body_match else response_text  # Use full text as fallback

            print("DEBUG: Parsed subject:", subject)
            print("DEBUG: Parsed body:", body)

            email_data = {
                "lead": lead.company_name,
                "email": lead.email,
                "subject": subject,
                "body": body,
            }

            # If preview mode is enabled, don't send emails—just return generated emails
            if preview_mode:
                emails_generated.append(email_data)
            else:
                try:
                    send_mail(
                        subject=subject,
                        message=body,
                        from_email=os.getenv("EMAIL_HOST_USER"),
                        recipient_list=[lead.email],
                        fail_silently=False,
                    )
                    print("DEBUG: Email sent to:", lead.email)
                    emails_generated.append(email_data)
                except Exception as e:
                    print("DEBUG: Error sending email to", lead.email, ":", e)
                    return JsonResponse({"error": "Failed to send email"}, status=500)

        message = "Emails generated successfully!" if preview_mode else "Emails sent successfully!"
        print("DEBUG: Final message:", message)
        return JsonResponse({"message": message, "emails": emails_generated})



def homepage(request):
    return render(request, 'leads/index.html')  # This will serve the React app's index.html
  # This will serve the React app's index.html


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

class EmailCampaignViewSet(viewsets.ModelViewSet):
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer

