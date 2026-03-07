"""
Générateur de rapports PDF avec ReportLab.
Produit : fiche patient, rapport épidémiologique, CR de RCP.
"""
import io
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF

# ── Couleurs ──────────────────────────────────────────────────────
BLUE_DARK  = colors.HexColor('#1A3A5C')
BLUE_MED   = colors.HexColor('#0077CC')
BLUE_LIGHT = colors.HexColor('#E8F4FF')
GREEN      = colors.HexColor('#00C080')
ORANGE     = colors.HexColor('#F5A623')
RED        = colors.HexColor('#FF4D6A')
GRAY_LIGHT = colors.HexColor('#F5F7FA')
GRAY_MED   = colors.HexColor('#9CA3AF')
WHITE      = colors.white

W, H = A4  # 595 × 842 pts

def _styles():
    s = getSampleStyleSheet()
    custom = {
        'Title': ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=18, textColor=BLUE_DARK, alignment=TA_CENTER, spaceAfter=4),
        'Subtitle': ParagraphStyle('Subtitle', fontName='Helvetica', fontSize=11, textColor=BLUE_MED, alignment=TA_CENTER, spaceAfter=12),
        'SectionHead': ParagraphStyle('SectionHead', fontName='Helvetica-Bold', fontSize=10, textColor=WHITE, spaceAfter=0, spaceBefore=10),
        'FieldLabel': ParagraphStyle('FieldLabel', fontName='Helvetica-Bold', fontSize=8.5, textColor=BLUE_DARK),
        'FieldValue': ParagraphStyle('FieldValue', fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#1a1a2e')),
        'Body': ParagraphStyle('Body', fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#333344'), leading=14),
        'Small': ParagraphStyle('Small', fontName='Helvetica', fontSize=7.5, textColor=GRAY_MED),
        'TableHead': ParagraphStyle('TableHead', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE, alignment=TA_CENTER),
        'TableCell': ParagraphStyle('TableCell', fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#1a1a2e')),
    }
    return {**{k: s[k] for k in s.byName}, **custom}

def _header_footer(canvas, doc):
    """Header et footer sur chaque page."""
    canvas.saveState()
    # Header bar
    canvas.setFillColor(BLUE_DARK)
    canvas.rect(0, H - 40, W, 40, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont('Helvetica-Bold', 10)
    canvas.drawString(1.5*cm, H - 25, "RegistreCancer.dz")
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(W - 1.5*cm, H - 25, date.today().strftime('%d/%m/%Y'))
    # Footer
    canvas.setFillColor(GRAY_LIGHT)
    canvas.rect(0, 0, W, 22, fill=1, stroke=0)
    canvas.setFillColor(GRAY_MED)
    canvas.setFont('Helvetica', 7)
    canvas.drawString(1.5*cm, 8, "Document généré automatiquement — RegistreCancer.dz — Confidentiel")
    canvas.drawRightString(W - 1.5*cm, 8, f"Page {doc.page}")
    canvas.restoreState()

def _section_title(text, styles):
    data = [[Paragraph(f'  {text}', styles['SectionHead'])]]
    t = Table(data, colWidths=[W - 3*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BLUE_MED),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [BLUE_MED]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def _field_row(label, value, styles, col_widths=None):
    if col_widths is None:
        col_widths = [4*cm, 12*cm]
    data = [[Paragraph(label, styles['FieldLabel']), Paragraph(str(value or '—'), styles['FieldValue'])]]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
    ]))
    return t


# ─────────────────────────────────────────────────────────────────
# 1. FICHE PATIENT PDF
# ─────────────────────────────────────────────────────────────────

def generate_fiche_patient_pdf(patient, diagnostics=None, traitements=None):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.8*cm, bottomMargin=1.5*cm,
        title=f"Fiche patient – {patient.registration_number}",
    )
    styles = _styles()
    story  = []

    # Titre
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("FICHE PATIENT", styles['Title']))
    story.append(Paragraph(
        f"N° Registre : <b>{patient.registration_number}</b>",
        styles['Subtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLUE_MED, spaceAfter=8))

    # ── Identité ───────────────────────────────────────────────
    story.append(_section_title("IDENTITÉ DU PATIENT", styles))
    story.append(Spacer(1, 4))

    identity_data = [
        ['Nom', f"{patient.nom} {patient.prenom}",   'Sexe', {'M':'Masculin','F':'Féminin','U':'Inconnu'}.get(patient.sexe,'—')],
        ['Date naiss.', patient.date_naissance.strftime('%d/%m/%Y') if patient.date_naissance else '—', 'Âge diag.', f"{patient.age_diagnostic} ans" if patient.age_diagnostic else '—'],
        ['Wilaya', patient.wilaya or '—', 'Commune', patient.commune or '—'],
        ['Téléphone', patient.telephone or '—', 'Profession', patient.profession or '—'],
    ]
    cw = [3*cm, 6*cm, 3*cm, 6*cm]
    t = Table(identity_data, colWidths=cw)
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('TEXTCOLOR', (0,0), (0,-1), BLUE_DARK),
        ('TEXTCOLOR', (2,0), (2,-1), BLUE_DARK),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, GRAY_LIGHT]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))

    # ── Statuts ────────────────────────────────────────────────
    story.append(_section_title("STATUT CLINIQUE", styles))
    story.append(Spacer(1, 4))

    STATUT_LABELS = {'nouveau':'Nouveau','traitement':'En traitement','remission':'Rémission','perdu':'Perdu de vue','decede':'Décédé','archive':'Archivé'}
    VITAL_LABELS  = {'vivant':'Vivant','decede':'Décédé','inconnu':'Inconnu'}

    status_data = [
        ['Statut dossier', STATUT_LABELS.get(patient.statut_dossier, '—'), 'Statut vital', VITAL_LABELS.get(patient.statut_vital, '—')],
        ['Date enregistrement', patient.date_enregistrement.strftime('%d/%m/%Y') if patient.date_enregistrement else '—',
         'Médecin référent', str(patient.medecin_referent) if patient.medecin_referent else '—'],
        ['Établissement', patient.etablissement_prise_en_charge or '—', 'ATCD familiaux', patient.antecedents_familiaux or '—'],
    ]
    t2 = Table(status_data, colWidths=cw)
    t2.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('TEXTCOLOR', (0,0), (0,-1), BLUE_DARK),
        ('TEXTCOLOR', (2,0), (2,-1), BLUE_DARK),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, GRAY_LIGHT]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t2)

    # ── Diagnostics ────────────────────────────────────────────
    if diagnostics:
        story.append(Spacer(1, 8))
        story.append(_section_title(f"DIAGNOSTICS ({len(diagnostics)})", styles))
        story.append(Spacer(1, 4))

        diag_header = ['Date', 'Topographie', 'Morphologie', 'Stade', 'TNM']
        diag_rows = [diag_header]
        for d in diagnostics:
            diag_rows.append([
                d.date_diagnostic.strftime('%d/%m/%Y') if d.date_diagnostic else '—',
                f"{d.topographie_code} – {d.topographie_libelle}"[:40],
                f"{d.morphologie_code}"[:20],
                d.stade_ajcc or '—',
                f"T{d.tnm_t or '?'}N{d.tnm_n or '?'}M{d.tnm_m or '?'}",
            ])

        dt = Table(diag_rows, colWidths=[2.5*cm, 6*cm, 4*cm, 2*cm, 3.5*cm])
        dt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, GRAY_LIGHT]),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('ALIGN', (3,0), (4,-1), 'CENTER'),
        ]))
        story.append(dt)

    # ── Traitements ────────────────────────────────────────────
    if traitements:
        story.append(Spacer(1, 8))
        story.append(_section_title(f"TRAITEMENTS ({len(traitements)})", styles))
        story.append(Spacer(1, 4))

        trt_header = ['Type', 'Détail', 'Début', 'Statut', 'Intention']
        trt_rows = [trt_header]
        TYPE_LABELS = {
            'chimiotherapie':'Chimio', 'radiotherapie':'Radio',
            'chirurgie':'Chirurgie', 'hormonotherapie':'Hormono', 'immunotherapie':'Immuno',
        }
        for trt in traitements:
            ttype = trt.get('type', '')
            trt_rows.append([
                TYPE_LABELS.get(ttype, ttype),
                trt.get('detail', '—')[:45],
                trt.get('date_debut', '—'),
                trt.get('statut', '—'),
                trt.get('intention', '—'),
            ])

        tt = Table(trt_rows, colWidths=[2.5*cm, 7*cm, 2.5*cm, 2.5*cm, 3*cm])
        tt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, GRAY_LIGHT]),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(tt)

    # Signature
    story.append(Spacer(1, 1.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRAY_MED))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"Document généré le {date.today().strftime('%d/%m/%Y')} — RegistreCancer.dz — Confidentiel",
        styles['Small']
    ))

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    buf.seek(0)
    return buf


# ─────────────────────────────────────────────────────────────────
# 2. RAPPORT ÉPIDÉMIOLOGIQUE PDF
# ─────────────────────────────────────────────────────────────────

def generate_rapport_epidemio_pdf(stats_data, annee=None):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.8*cm, bottomMargin=1.5*cm,
        title=f"Rapport épidémiologique{' ' + str(annee) if annee else ''}",
    )
    styles = _styles()
    story  = []
    kpis   = stats_data.get('kpis', {})

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("RAPPORT ÉPIDÉMIOLOGIQUE", styles['Title']))
    story.append(Paragraph(
        f"Registre du Cancer — Algérie{' — ' + str(annee) if annee else ''}",
        styles['Subtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=BLUE_DARK, spaceAfter=10))

    # ── KPIs ──────────────────────────────────────────────────
    story.append(_section_title("INDICATEURS CLÉS", styles))
    story.append(Spacer(1, 6))

    kpi_items = [
        ('Total patients', kpis.get('total_patients', 0), BLUE_MED),
        ('Total diagnostics', kpis.get('total_diagnostics', 0), BLUE_MED),
        ('En traitement', kpis.get('en_traitement', 0), ORANGE),
        ('En rémission', kpis.get('en_remission', 0), GREEN),
        ('Décédés', kpis.get('decedes', 0), RED),
        ('Total traitements', kpis.get('total_traitements', 0), BLUE_MED),
    ]

    kpi_data = []
    row = []
    for i, (label, val, col) in enumerate(kpi_items):
        cell_content = Table(
            [[Paragraph(f'<font color="{col.hexval()}" size="18"><b>{val}</b></font>', styles['Body'])],
             [Paragraph(label, styles['Small'])]],
            colWidths=[5*cm]
        )
        cell_content.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BACKGROUND', (0,0), (-1,-1), GRAY_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        row.append(cell_content)
        if len(row) == 3 or i == len(kpi_items) - 1:
            while len(row) < 3:
                row.append('')
            kpi_data.append(row)
            row = []

    kpi_table = Table(kpi_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    kpi_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 10))

    # ── Répartition par sexe ───────────────────────────────────
    story.append(_section_title("RÉPARTITION PAR SEXE", styles))
    story.append(Spacer(1, 6))

    par_sexe = stats_data.get('par_sexe', {})
    total_sexe = (par_sexe.get('M', 0) or 0) + (par_sexe.get('F', 0) or 0)
    if total_sexe > 0:
        sexe_data = [
            ['Sexe', 'Nombre', '%'],
            ['Masculin', par_sexe.get('M', 0), f"{(par_sexe.get('M',0)/total_sexe*100):.1f}%"],
            ['Féminin',  par_sexe.get('F', 0), f"{(par_sexe.get('F',0)/total_sexe*100):.1f}%"],
            ['Total',    total_sexe, '100%'],
        ]
        st = Table(sexe_data, colWidths=[6*cm, 5*cm, 5*cm])
        st.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('BACKGROUND', (0,-1), (-1,-1), BLUE_LIGHT),
            ('ROWBACKGROUNDS', (0,1), (-1,-2), [WHITE, GRAY_LIGHT]),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(st)

    # ── Top cancers ────────────────────────────────────────────
    top_cancers = stats_data.get('top_cancers', [])
    if top_cancers:
        story.append(Spacer(1, 10))
        story.append(_section_title("TOP 10 LOCALISATIONS TUMORALES", styles))
        story.append(Spacer(1, 6))

        can_data = [['Rang', 'Code ICD-O', 'Localisation', 'Cas']]
        for i, c in enumerate(top_cancers[:10], 1):
            can_data.append([
                str(i),
                c.get('topographie_code', ''),
                c.get('topographie_libelle', '')[:50],
                str(c.get('count', 0)),
            ])

        ct = Table(can_data, colWidths=[1.5*cm, 3*cm, 11*cm, 2.5*cm])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, GRAY_LIGHT]),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('ALIGN', (3,0), (3,-1), 'CENTER'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(ct)

    # ── Top wilayas ────────────────────────────────────────────
    top_wilayas = stats_data.get('top_wilayas', [])
    if top_wilayas:
        story.append(Spacer(1, 10))
        story.append(_section_title("INCIDENCE PAR WILAYA (TOP 15)", styles))
        story.append(Spacer(1, 6))

        wil_data = [['Rang', 'Wilaya', 'Patients']]
        for i, w in enumerate(top_wilayas[:15], 1):
            wil_data.append([str(i), w.get('wilaya', ''), str(w.get('count', 0))])

        wt = Table(wil_data, colWidths=[2*cm, 12*cm, 4*cm])
        wt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, GRAY_LIGHT]),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('ALIGN', (2,0), (2,-1), 'CENTER'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(wt)

    # Pied
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRAY_MED))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"Rapport généré le {date.today().strftime('%d %B %Y')} — RegistreCancer.dz",
        styles['Small']
    ))

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    buf.seek(0)
    return buf
