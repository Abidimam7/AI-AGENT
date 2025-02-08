from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    ChatbotView,
    get_uploaded_leads,
    upload_leads,
    RegisterView,
    LoginView,     
    AIEmailGeneratorView,
    EmailSettingsView,
    EmailLogListView,
)

router = DefaultRouter()
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'leads', views.LeadViewSet)
router.register(r'email_campaigns', views.EmailCampaignViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/chat/', ChatbotView.as_view(), name='chatbot'),
    path('api/uploaded-leads/', get_uploaded_leads, name='uploaded-leads'),
    path('api/upload-leads/', upload_leads, name='upload-leads'),
    path('generate-emails/', AIEmailGeneratorView.as_view(), name='generate-emails'),
    path('api/email-settings/', EmailSettingsView.as_view(), name='email-settings'),
    path('api/email-logs/', EmailLogListView.as_view(), name='email-logs'),
    # path('', views.homepage, name='homepage'),
]
