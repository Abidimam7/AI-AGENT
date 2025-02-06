from rest_framework import serializers
from .models import Supplier, Lead, EmailCampaign, UploadedLead
from django.contrib.auth.models import User
from .models import EmailSettings ,EmailLog

# Supplier Serializer
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['user']

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
        read_only_fields = ['user']

# Chatbot Serializers
class ChatInputSerializer(serializers.Serializer):
    user_input = serializers.CharField(required=True)
    context = serializers.DictField(required=False, default={})
    active_lead = serializers.DictField(required=False, allow_null=True)

class ChatResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    sources = serializers.ListField(child=serializers.CharField())
    context = serializers.DictField()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class EmailSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailSettings
        fields = ['email_host', 'email_port', 'email_use_tls', 'email_host_user', 'email_host_password']

class EmailLogSerializer(serializers.ModelSerializer):
    supplier = serializers.StringRelatedField()
    lead = serializers.StringRelatedField()
    
    class Meta:
        model = EmailLog
        fields = '__all__'
