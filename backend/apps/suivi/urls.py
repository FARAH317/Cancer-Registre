from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsultationSuiviViewSet, QualiteVieViewSet, EvenementCliniqueViewSet

router = DefaultRouter()
router.register(r'consultations', ConsultationSuiviViewSet, basename='consultation')
router.register(r'qualite-vie',   QualiteVieViewSet,        basename='qualite-vie')
router.register(r'evenements',    EvenementCliniqueViewSet,  basename='evenement')

urlpatterns = [path('', include(router.urls))]
