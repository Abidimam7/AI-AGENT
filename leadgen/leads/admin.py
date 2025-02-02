from django.contrib import admin
from .models import Supplier, Lead, EmailCampaign, UploadedLead

# Admin for Supplier model
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_name', 'contact_email', 'product_name')
    search_fields = ('company_name', 'contact_name', 'contact_email')
    ordering = ('company_name',)

admin.site.register(Supplier, SupplierAdmin)

# Admin for Lead model
class LeadAdmin(admin.ModelAdmin):
    list_display = ('name', 'supplier', 'industry', 'location', 'status', 'date_generated')
    list_filter = ('status', 'date_generated')
    search_fields = ('name', 'industry', 'location')
    ordering = ('-date_generated',)

admin.site.register(Lead, LeadAdmin)

# Admin for EmailCampaign model
class EmailCampaignAdmin(admin.ModelAdmin):
    list_display = ('lead', 'subject', 'status', 'sent_at')
    list_filter = ('status', 'sent_at')
    search_fields = ('subject', 'lead__name')
    ordering = ('-sent_at',)

admin.site.register(EmailCampaign, EmailCampaignAdmin)

# Admin for UploadedLead model
class UploadedLeadAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_name', 'email', 'phone', 'source', 'uploaded_at','address')
    list_filter = ('source', 'uploaded_at')
    search_fields = ('company_name', 'contact_name', 'email','address')
    ordering = ('-uploaded_at',)

admin.site.register(UploadedLead, UploadedLeadAdmin)
