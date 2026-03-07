# apps/voice/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('transcribe/',    views.transcribe_audio,      name='voice-transcribe'),
    path('extract/',       views.extract_voice_fields,  name='voice-extract'),
    path('debug-config/',  views.debug_voice_config,    name='voice-debug'),
]