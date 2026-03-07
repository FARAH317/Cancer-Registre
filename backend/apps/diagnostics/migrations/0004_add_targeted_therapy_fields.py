from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Ajoute les champs de biologie moléculaire / thérapies ciblées au modèle Diagnostic.
    Dépend de la migration 0003 (dernière migration existante du projet).
    """

    dependencies = [
        ('diagnostics', '0003_alter_diagnostic_est_principal_alter_diagnostic_ki67_and_more'),
    ]

    STATUS_CHOICES = [
        ('non_fait',  'Non fait'),
        ('positif',   'Positif / Muté'),
        ('negatif',   'Négatif / Non muté'),
        ('amplifie',  'Amplifié'),
        ('surexprime','Sur-exprimé'),
        ('inconnu',   'Inconnu'),
    ]

    operations = [
        # ── Mutations oncogènes actionables ───────────────────────
        migrations.AddField('Diagnostic', 'egfr',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='EGFR')),
        migrations.AddField('Diagnostic', 'egfr_exon',
            models.CharField(max_length=50, blank=True,
                verbose_name='EGFR – exon / variant')),

        migrations.AddField('Diagnostic', 'kras',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='KRAS')),
        migrations.AddField('Diagnostic', 'kras_codon',
            models.CharField(max_length=50, blank=True,
                verbose_name='KRAS – codon / variant')),

        migrations.AddField('Diagnostic', 'nras',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='NRAS')),

        migrations.AddField('Diagnostic', 'braf',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='BRAF')),
        migrations.AddField('Diagnostic', 'braf_variant',
            models.CharField(max_length=50, blank=True,
                verbose_name='BRAF – variant (ex. V600E)')),

        migrations.AddField('Diagnostic', 'alk',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='ALK')),
        migrations.AddField('Diagnostic', 'ros1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='ROS1')),
        migrations.AddField('Diagnostic', 'ret',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='RET')),
        migrations.AddField('Diagnostic', 'met',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='MET')),
        migrations.AddField('Diagnostic', 'met_exon14',
            models.BooleanField(null=True, blank=True,
                verbose_name='MET exon 14 skipping')),

        migrations.AddField('Diagnostic', 'pik3ca',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='PIK3CA')),

        # ── Gènes suppresseurs & prédisposition ──────────────────
        migrations.AddField('Diagnostic', 'brca1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='BRCA1')),
        migrations.AddField('Diagnostic', 'brca2',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='BRCA2')),
        migrations.AddField('Diagnostic', 'tp53',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='TP53')),
        migrations.AddField('Diagnostic', 'nf1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='NF1')),
        migrations.AddField('Diagnostic', 'rb1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='RB1')),
        migrations.AddField('Diagnostic', 'apc',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='APC')),
        migrations.AddField('Diagnostic', 'cdh1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='CDH1')),
        migrations.AddField('Diagnostic', 'vhl',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES, verbose_name='VHL')),

        # ── MSI / TMB ─────────────────────────────────────────────
        migrations.AddField('Diagnostic', 'msi_statut',
            models.CharField(max_length=15, blank=True,
                choices=[
                    ('mss',     'MSS – Stable'),
                    ('msi_l',   'MSI-L – Faible instabilité'),
                    ('msi_h',   'MSI-H – Haute instabilité'),
                    ('inconnu', 'Inconnu'),
                ], verbose_name='Statut MSI')),
        migrations.AddField('Diagnostic', 'tmb',
            models.CharField(max_length=20, blank=True,
                verbose_name='TMB (mut/Mb)')),
        migrations.AddField('Diagnostic', 'tmb_statut',
            models.CharField(max_length=10, blank=True,
                choices=[
                    ('bas',    'Bas (< 10)'),
                    ('eleve',  'Élevé (≥ 10)'),
                    ('inconnu','Inconnu'),
                ], verbose_name='TMB – statut')),

        # ── Panel NGS ─────────────────────────────────────────────
        migrations.AddField('Diagnostic', 'panel_ngs',
            models.CharField(max_length=200, blank=True,
                verbose_name='Panel NGS utilisé')),
        migrations.AddField('Diagnostic', 'date_test_moleculaire',
            models.DateField(null=True, blank=True,
                verbose_name='Date du test moléculaire')),
        migrations.AddField('Diagnostic', 'laboratoire_moleculaire',
            models.CharField(max_length=200, blank=True,
                verbose_name='Laboratoire de biologie moléculaire')),

        # ── Conclusion thérapeutique ───────────────────────────────
        migrations.AddField('Diagnostic', 'therapie_ciblee_recommandee',
            models.TextField(blank=True,
                verbose_name='Thérapie ciblée recommandée')),
        migrations.AddField('Diagnostic', 'resistances_connues',
            models.TextField(blank=True,
                verbose_name='Résistances connues')),
        migrations.AddField('Diagnostic', 'autres_alterations',
            models.TextField(blank=True,
                verbose_name='Autres altérations moléculaires')),
    ]


    STATUS_CHOICES = [
        ('non_fait',  'Non fait'),
        ('positif',   'Positif / Muté'),
        ('negatif',   'Négatif / Non muté'),
        ('amplifie',  'Amplifié'),
        ('surexprime','Sur-exprimé'),
        ('inconnu',   'Inconnu'),
    ]

    operations = [
        # ── Mutations génétiques ──────────────────────────────────
        migrations.AddField('Diagnostic', 'egfr',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='EGFR')),
        migrations.AddField('Diagnostic', 'egfr_exon',
            models.CharField(max_length=50, blank=True,
                verbose_name='EGFR – exon / variant')),

        migrations.AddField('Diagnostic', 'kras',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='KRAS')),
        migrations.AddField('Diagnostic', 'kras_codon',
            models.CharField(max_length=50, blank=True,
                verbose_name='KRAS – codon / variant')),

        migrations.AddField('Diagnostic', 'nras',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='NRAS')),

        migrations.AddField('Diagnostic', 'braf',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='BRAF')),
        migrations.AddField('Diagnostic', 'braf_variant',
            models.CharField(max_length=50, blank=True,
                verbose_name='BRAF – variant (ex. V600E)')),

        migrations.AddField('Diagnostic', 'alk',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='ALK')),
        migrations.AddField('Diagnostic', 'ros1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='ROS1')),
        migrations.AddField('Diagnostic', 'ret',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='RET')),
        migrations.AddField('Diagnostic', 'met',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='MET')),
        migrations.AddField('Diagnostic', 'met_exon14',
            models.BooleanField(null=True, blank=True,
                verbose_name='MET exon 14 skipping')),

        migrations.AddField('Diagnostic', 'pik3ca',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='PIK3CA')),

        migrations.AddField('Diagnostic', 'brca1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='BRCA1')),
        migrations.AddField('Diagnostic', 'brca2',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='BRCA2')),

        migrations.AddField('Diagnostic', 'tp53',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='TP53')),

        migrations.AddField('Diagnostic', 'nf1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='NF1')),
        migrations.AddField('Diagnostic', 'rb1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='RB1')),
        migrations.AddField('Diagnostic', 'apc',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='APC')),
        migrations.AddField('Diagnostic', 'cdh1',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='CDH1')),
        migrations.AddField('Diagnostic', 'vhl',
            models.CharField(max_length=20, blank=True,
                choices=STATUS_CHOICES,
                verbose_name='VHL')),

        # ── Instabilité microsatellites & TMB ────────────────────
        migrations.AddField('Diagnostic', 'msi_statut',
            models.CharField(max_length=15, blank=True,
                choices=[
                    ('mss',     'MSS – Stable'),
                    ('msi_l',   'MSI-L – Faible instabilité'),
                    ('msi_h',   'MSI-H – Haute instabilité'),
                    ('inconnu', 'Inconnu'),
                ],
                verbose_name='Statut MSI')),
        migrations.AddField('Diagnostic', 'tmb',
            models.CharField(max_length=20, blank=True,
                verbose_name='TMB (mut/Mb)')),
        migrations.AddField('Diagnostic', 'tmb_statut',
            models.CharField(max_length=10, blank=True,
                choices=[('bas','Bas (< 10)'),('eleve','Élevé (≥ 10)'),('inconnu','Inconnu')],
                verbose_name='TMB – statut')),

        # ── Panel NGS ────────────────────────────────────────────
        migrations.AddField('Diagnostic', 'panel_ngs',
            models.CharField(max_length=200, blank=True,
                verbose_name='Panel NGS utilisé')),
        migrations.AddField('Diagnostic', 'date_test_moleculaire',
            models.DateField(null=True, blank=True,
                verbose_name='Date du test moléculaire')),
        migrations.AddField('Diagnostic', 'laboratoire_moleculaire',
            models.CharField(max_length=200, blank=True,
                verbose_name='Laboratoire de biologie moléculaire')),

        # ── Conclusion & Thérapie ciblée ────────────────────────
        migrations.AddField('Diagnostic', 'therapie_ciblee_recommandee',
            models.TextField(blank=True,
                verbose_name='Thérapie ciblée recommandée')),
        migrations.AddField('Diagnostic', 'resistances_connues',
            models.TextField(blank=True,
                verbose_name='Résistances connues')),
        migrations.AddField('Diagnostic', 'autres_alterations',
            models.TextField(blank=True,
                verbose_name='Autres altérations moléculaires')),
    ]