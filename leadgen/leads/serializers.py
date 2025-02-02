from rest_framework import serializers
from .models import Supplier, Lead, EmailCampaign, UploadedLead

# Supplier Serializer
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

# Lead Serializer
class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

# Email Campaign Serializer
class EmailCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailCampaign
        fields = '__all__'

# Uploaded Lead Serializer
class UploadedLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedLead
        fields = '__all__'

# Chatbot Serializers
class ChatInputSerializer(serializers.Serializer):
    user_input = serializers.CharField(required=True)
    context = serializers.DictField(required=False, default={})
    active_lead = serializers.DictField(required=False, allow_null=True)

class ChatResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    sources = serializers.ListField(child=serializers.CharField())
    context = serializers.DictField()
