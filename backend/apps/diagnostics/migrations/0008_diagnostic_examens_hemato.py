from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('diagnostics', '0007_merge_20260307_0200'),
    ]

    operations = [
        migrations.AddField(
            model_name='diagnostic',
            name='examens_hemato',
            field=models.JSONField(
                blank=True,
                default=dict,
                null=True,
                verbose_name='Examens hématologiques',
                help_text=(
                    "Résultats des examens pour les hémopathies malignes. "
                    "Structure : { 'nfs': '...', 'myelogramme': '...', 'fish_medullaire': '...' }"
                ),
            ),
        ),
    ]
