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
import json
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




# Configure a logger for this module
logger = logging.getLogger(__name__)

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

