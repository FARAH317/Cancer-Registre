"""
voice/views.py
Transcription audio via Groq Whisper + extraction NLP via LLaMA.
Utilise 'requests' directement pour éviter les problèmes de version groq/httpx.
"""
import logging
import json
import tempfile
import os
import requests

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logger = logging.getLogger(__name__)

PROMPTS = {
    'patient': """Tu es un assistant médical pour un registre du cancer algérien.
Extrais les informations du patient depuis la dictée vocale du médecin.
Retourne UNIQUEMENT un objet JSON valide avec les champs trouvés.
Champs possibles : nom, prenom, date_naissance (YYYY-MM-DD), lieu_naissance,
sexe (M/F), nationalite, telephone, telephone2, email, adresse, wilaya, commune,
profession, situation_familiale, nombre_enfants, niveau_instruction,
id_national, statut_vital, antecedents_personnels, antecedents_familiaux, notes.
Les dates en français -> convertir en YYYY-MM-DD.
N'inclus PAS les champs non mentionnés. Réponds UNIQUEMENT avec le JSON.""",

    'diagnostic': """Tu es un assistant médical pour un registre du cancer algérien.
Extrais les informations du diagnostic depuis la dictée vocale.
Retourne UNIQUEMENT un objet JSON valide avec les champs trouvés.
Champs possibles : topographie_code, topographie_libelle, morphologie_code,
morphologie_libelle, date_diagnostic (YYYY-MM-DD), stade_ajcc, tnm_t, tnm_n, tnm_m,
lateralite, base_diagnostic, observations, compte_rendu_anapath.
Réponds UNIQUEMENT avec le JSON.""",

    'traitement': """Tu es un assistant médical pour un registre du cancer algérien.
Extrais les informations du traitement depuis la dictée vocale.
Retourne UNIQUEMENT un objet JSON valide avec les champs trouvés.
Champs possibles : type_traitement, date_debut, date_fin, protocole,
nombre_cycles, dose, technique, dose_totale, type_chirurgie, intention,
etablissement, medecin_responsable, observations.
Réponds UNIQUEMENT avec le JSON.""",

    'suivi': """Tu es un assistant médical pour un registre du cancer algérien.
Extrais les informations de consultation/suivi depuis la dictée vocale.
Retourne UNIQUEMENT un objet JSON valide avec les champs trouvés.
Champs possibles : date_consultation, motif, poids, taille, tension_arterielle,
performance_status, evolution, observations, plan_traitement, prochain_rdv.
Réponds UNIQUEMENT avec le JSON.""",
}

GROQ_API_URL_TRANSCRIBE = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_API_URL_CHAT       = "https://api.groq.com/openai/v1/chat/completions"


def get_groq_api_key():
    """
    Cherche GROQ_API_KEY dans l'ordre :
      1. settings.GROQ_API_KEY
      2. os.environ['GROQ_API_KEY']
      3. python-decouple / fichier .env
    """
    key = getattr(settings, 'GROQ_API_KEY', None)
    if key and str(key).strip():
        return str(key).strip()

    key = os.environ.get('GROQ_API_KEY', '').strip()
    if key:
        return key

    try:
        from decouple import config
        key = config('GROQ_API_KEY', default='').strip()
        if key:
            return key
    except Exception:
        pass

    raise ValueError(
        "GROQ_API_KEY introuvable.\n"
        "Ajoutez-la selon votre configuration :\n"
        "  settings.py : GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')\n"
        "  .env        : GROQ_API_KEY=gsk_...\n"
        "  Shell       : export GROQ_API_KEY=gsk_..."
    )


def get_headers():
    """Retourne les headers HTTP pour Groq API."""
    return {
        "Authorization": f"Bearer {get_groq_api_key()}"
    }


# ──────────────────────────────────────────────────────────────────
# ENDPOINT 1 : Audio -> texte  (Groq Whisper)
# POST /api/v1/voice/transcribe/
# Body : multipart/form-data { audio: <fichier>, language: "fr" }
# ──────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transcribe_audio(request):
    audio_file = request.FILES.get('audio')
    language   = request.data.get('language', 'fr')

    if not audio_file:
        return Response({'error': 'Aucun fichier audio reçu.'},
                        status=status.HTTP_400_BAD_REQUEST)

    content_type = audio_file.content_type or ''
    ext_map = {
        'audio/webm': '.webm', 'video/webm': '.webm',
        'audio/ogg':  '.ogg',
        'audio/wav':  '.wav',
        'audio/mp4':  '.mp4',
        'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
    }
    ext = ext_map.get(content_type, '.webm')

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        with open(tmp_path, 'rb') as f:
            response = requests.post(
                GROQ_API_URL_TRANSCRIBE,
                headers=get_headers(),
                files={"file": (os.path.basename(tmp_path), f, content_type or 'audio/webm')},
                data={
                    "model": "whisper-large-v3-turbo",
                    "language": language,
                    "response_format": "text",
                },
                timeout=60,
                # Désactiver les proxies système pour éviter les erreurs
                proxies={"http": None, "https": None},
            )

        if response.status_code != 200:
            logger.error('Groq transcription error %s: %s', response.status_code, response.text)
            return Response(
                {'error': f'Erreur Groq ({response.status_code}): {response.text}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        text = response.text.strip()
        return Response({'transcript': text})

    except ValueError as e:
        logger.error('Config Groq: %s', e)
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except requests.exceptions.ConnectionError:
        return Response(
            {'error': 'Impossible de joindre api.groq.com — vérifiez votre connexion internet.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except Exception as e:
        logger.exception('Erreur transcription: %s', e)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ──────────────────────────────────────────────────────────────────
# ENDPOINT 2 : Texte -> champs JSON  (Groq LLaMA)
# POST /api/v1/voice/extract/
# Body : { transcript: "...", form_type: "patient" }
# ──────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extract_voice_fields(request):
    transcript = request.data.get('transcript', '').strip()
    form_type  = request.data.get('form_type', 'patient')

    if not transcript:
        return Response({'fields': {}})

    if form_type not in PROMPTS:
        return Response(
            {'error': 'form_type invalide. Valeurs : ' + str(list(PROMPTS.keys()))},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": PROMPTS[form_type]},
                {"role": "user",   "content": transcript},
            ],
            "temperature": 0.2,
            "max_tokens": 1200,
        }

        response = requests.post(
            GROQ_API_URL_CHAT,
            headers={**get_headers(), "Content-Type": "application/json"},
            json=payload,
            timeout=30,
            proxies={"http": None, "https": None},
        )

        if response.status_code != 200:
            logger.error('Groq extraction error %s: %s', response.status_code, response.text)
            return Response(
                {'error': f'Erreur Groq ({response.status_code})'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        data = response.json()
        text  = data['choices'][0]['message']['content'].strip()
        bt    = chr(96) * 3
        clean = text.replace(bt + 'json', '').replace(bt, '').strip()
        fields = json.loads(clean)
        return Response({'fields': fields, 'transcript': transcript})

    except ValueError as e:
        logger.error('Config Groq: %s', e)
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except json.JSONDecodeError:
        return Response({'fields': {}, 'error': 'Extraction impossible — dictée trop peu claire.'})
    except Exception as e:
        logger.exception('Erreur extraction: %s', e)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────────────────
# ENDPOINT DEBUG
# GET /api/v1/voice/debug-config/
# ──────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_voice_config(request):
    def mask(k):
        if not k:
            return None
        s = str(k).strip()
        return s[:8] + '...' + s[-4:] if len(s) > 12 else '***'

    settings_key = getattr(settings, 'GROQ_API_KEY', None)
    env_key      = os.environ.get('GROQ_API_KEY', None)
    decouple_key = None
    try:
        from decouple import config
        decouple_key = config('GROQ_API_KEY', default=None)
    except Exception:
        pass

    found = next((k for k in [settings_key, env_key, decouple_key] if k and str(k).strip()), None)

    # اختبار الاتصال بـ Groq
    groq_reachable = False
    groq_error = None
    if found:
        try:
            r = requests.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {found}"},
                timeout=5,
                proxies={"http": None, "https": None},
            )
            groq_reachable = r.status_code == 200
            if not groq_reachable:
                groq_error = f"HTTP {r.status_code}"
        except Exception as e:
            groq_error = str(e)

    return Response({
        'status':                  'OK - cle trouvee' if found else 'ERREUR - aucune cle',
        'settings.GROQ_API_KEY':   mask(settings_key)  or 'absent',
        'os.environ.GROQ_API_KEY': mask(env_key)        or 'absent',
        'decouple.GROQ_API_KEY':   mask(decouple_key)   or 'absent',
        'groq_api_reachable':      groq_reachable,
        'groq_error':              groq_error,
        'DJANGO_SETTINGS_MODULE':  os.environ.get('DJANGO_SETTINGS_MODULE', '?'),
        'hint': (
            "Ajoutez dans settings.py : GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')"
            if not found else 'Configuration OK'
        ),
    })