from django.db import models

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


    def __str__(self):
        return self.company_name

class Lead(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='leads')
    name = models.CharField(max_length=255, blank=True, null=True, default='Default Lead')
    industry = models.CharField(max_length=255, blank=True, null=True, default='Default Industry')
    location = models.CharField(max_length=255, blank=True, null=True, default='Default Location')
    status = models.CharField(max_length=100, default='New')  # New, Contacted, Closed
    date_generated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UploadedLead(models.Model):
    company_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    source = models.CharField(max_length=50, default="Manual Upload")  # Identify source of lead
    uploaded_at = models.DateTimeField(auto_now_add=True)

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



