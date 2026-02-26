from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_global, name='dashboard'),
    path('alertes/',   views.alertes,           name='alertes'),
]
