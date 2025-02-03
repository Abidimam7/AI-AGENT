from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ChatbotView, get_uploaded_leads,upload_leads
from .views import AIEmailGeneratorView

router = DefaultRouter()
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'leads', views.LeadViewSet)
router.register(r'email_campaigns', views.EmailCampaignViewSet)

urlpatterns = [
    path('api/', include(router.urls)),  # API endpoints should be prefixed with 'api/'
    path('', views.homepage, name='homepage'),  # Homepage should be the root URL
    path('api/chat/', ChatbotView.as_view(), name='chatbot'),
    path("leads/", ChatbotView.as_view(), name="generate_leads"),
    path('api/uploaded-leads/', get_uploaded_leads, name='uploaded-leads'),  # Added endpoint for uploaded leads
    path('api/upload-leads/', upload_leads, name='upload-leads'),
    path("generate-emails/", AIEmailGeneratorView.as_view(), name="generate-emails"),
]
