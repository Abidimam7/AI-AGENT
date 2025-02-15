from django.db import models
from django.contrib.auth.models import User
from django.conf import settings  
import os
from cryptography.fernet import Fernet


class Supplier(models.Model):
    company_name = models.CharField(max_length=255, default='Default Company Name')
    company_website = models.URLField(blank=True, null=True, default='http://default.com')
    contact_name = models.CharField(max_length=255, default='Name')
    contact_email = models.EmailField(default='example@domain.com')
    contact_phone = models.CharField(max_length=20, blank=True, null=True, default='1234567890')
    product_name = models.CharField(max_length=255, default='Default Product')
    product_description = models.TextField(default='Default description of the product')
    key_features = models.TextField(default='Default key features')
    primary_use_cases = models.TextField(default='Default use cases')
    has_api = models.BooleanField(default=False)
    api_documentation_link = models.URLField(blank=True, null=True, default='http://default.com')
    pricing_model = models.CharField(max_length=255, default='Default pricing model')
    sales_cycle_length = models.CharField(max_length=255, blank=True, null=True, default='Default cycle length')
    commission_structure = models.CharField(max_length=255, blank=True, null=True, default='Default commission structure')
    discounts_offers = models.TextField(blank=True, null=True, default='No discounts/offers')
    common_pain_points = models.TextField(default="Not specified")
    marketing_materials = models.TextField(blank=True, null=True, default='No materials available')
    customer_success_stories = models.TextField(blank=True, null=True, default='No success stories')
    onboarding_training = models.TextField(blank=True, null=True, default='No onboarding training')
    top_competitors = models.TextField(blank=True, null=True, default='No top competitors')
    branding_guidelines = models.TextField(blank=True, null=True, default='No branding guidelines')
    additional_info = models.TextField(blank=True, null=True, default='No additional info')
    cost_information = models.CharField(max_length=255, blank=True, null=True, default='No cost info')
    years_in_business = models.IntegerField(blank=True, null=True, default=0)
    funding_info = models.TextField(blank=True, null=True, default='No funding info')
    product_demo_link = models.URLField(blank=True, null=True, default='http://default.com')
    company_description = models.CharField(max_length=255, blank=True, null=True, default='Default description')
    ideal_customer_profile = models.TextField(blank=True, null=True, default='Default ideal customer profile')
    technical_requirements = models.TextField(blank=True, null=True, default='Default technical requirements')
    unique_selling_points = models.TextField(blank=True, null=True, default='Default unique selling points')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)


    def __str__(self):
        return self.company_name

from django.db import models

class Lead(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='leads')
    company_name = models.CharField(max_length=255, blank=False, null=False, default="Unknown Company")
    name = models.CharField(max_length=255, blank=True, null=True, default='Default Lead')
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True, default='Default Industry')
    location = models.CharField(max_length=255, blank=True, null=True, default='Default Location')
    status = models.CharField(max_length=100, default='New')  # e.g., New, Contacted, Closed
    date_generated = models.DateTimeField(auto_now_add=True)
    is_generated = models.BooleanField(default=False)  # True if generated via chatbot

    def __str__(self):
        return self.company_name



class UploadedLead(models.Model):
    company_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    source = models.CharField(max_length=50, default="Manual Upload")  # Identify source of lead
    uploaded_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_leads', null=True, blank=True)

    def __str__(self):
        return self.company_name  # Fixed this line


class EmailCampaign(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='email_campaigns')
    subject = models.CharField(max_length=255, default='Default subject')
    body = models.TextField(default='Default body content')
    status = models.CharField(max_length=100, default='Pending')  # Pending, Sent, Failed
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.subject


class EmailSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email_host = models.CharField(max_length=255, default='smtp.gmail.com')
    email_port = models.IntegerField(default=587)
    email_use_tls = models.BooleanField(default=True)
    email_host_user = models.EmailField()
    email_host_password = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        # Encrypt the email_host_password if it's not already encrypted
        if self.email_host_password and not self.email_host_password.startswith("gAAAA"):
            f = Fernet(settings.EMAIL_ENCRYPTION_KEY)
            self.email_host_password = f.encrypt(self.email_host_password.encode()).decode()
        super().save(*args, **kwargs)

    def get_decrypted_password(self):
        f = Fernet(settings.EMAIL_ENCRYPTION_KEY)
        return f.decrypt(self.email_host_password.encode()).decode()

    def __str__(self):
        return f"{self.user.username}'s Email Settings"

class EmailLog(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE)
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50)  # e.g., "sent" or "failed"
    delivered = models.BooleanField(default=False)  # Email delivered status
    read = models.BooleanField(default=False)       # Email read status
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.supplier.company_name} -> {self.lead.email} at {self.sent_at} | Delivered: {self.delivered}, Read: {self.read}"
