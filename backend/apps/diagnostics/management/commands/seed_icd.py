from django.core.management.base import BaseCommand
from apps.diagnostics.models import TopographieICD, MorphologieICD
from apps.diagnostics.icd_data import TOPOGRAPHIES, MORPHOLOGIES


class Command(BaseCommand):
    help = 'Charge les référentiels ICD-O-3 (topographies et morphologies)'

    def handle(self, *args, **options):
        self.stdout.write('⏳ Chargement des topographies ICD-O-3...')
        created_t = 0
        for item in TOPOGRAPHIES:
            _, created = TopographieICD.objects.get_or_create(
                code=item['code'],
                defaults={
                    'libelle':   item['libelle'],
                    'categorie': item.get('categorie', ''),
                }
            )
            if created:
                created_t += 1
        self.stdout.write(self.style.SUCCESS(f'  ✓ {created_t} topographies créées ({len(TOPOGRAPHIES)} total)'))

        self.stdout.write('⏳ Chargement des morphologies ICD-O-3...')
        created_m = 0
        for item in MORPHOLOGIES:
            _, created = MorphologieICD.objects.get_or_create(
                code=item['code'],
                defaults={
                    'libelle':      item['libelle'],
                    'groupe':       item.get('groupe', ''),
                    'comportement': item.get('comportement', '3'),
                }
            )
            if created:
                created_m += 1
        self.stdout.write(self.style.SUCCESS(f'  ✓ {created_m} morphologies créées ({len(MORPHOLOGIES)} total)'))
        self.stdout.write(self.style.SUCCESS('✅ Référentiels ICD-O-3 chargés avec succès !'))
