import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime

def generate_pdf_report(report_type: str, month: int, year: int, data: dict, ai_summary: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#4f46e5'), spaceAfter=20)
    header_style = ParagraphStyle('HeaderStyle', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor('#1e293b'), spaceAfter=10)
    normal_style = styles['Normal']
    
    # Page 1: Header
    elements.append(Paragraph(f"HRMS Pro - {report_type.title()} Report", title_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", normal_style))
    elements.append(Spacer(1, 20))
    
    # AI Summary Section (Indigo background)
    elements.append(Paragraph("AI Insights & Executive Summary", header_style))
    
    # Create a nice box for AI summary using a single-cell table
    summary_text = f"<b>Overall Health:</b> {ai_summary.get('overall_health', 'N/A')}<br/><br/>"
    summary_text += f"{ai_summary.get('executive_summary', '')}<br/><br/>"
    
    summary_text += "<b>Highlights:</b><br/>"
    for h in ai_summary.get('highlights', []):
        summary_text += f"- {h}<br/>"
        
    summary_text += "<br/><b>Concerns:</b><br/>"
    for c in ai_summary.get('concerns', []):
        summary_text += f"- {c}<br/>"
        
    summary_text += "<br/><b>Recommendations:</b><br/>"
    for r in ai_summary.get('recommendations', []):
        summary_text += f"- {r}<br/>"
        
    summary_paragraph = Paragraph(summary_text, normal_style)
    
    ai_table = Table([[summary_paragraph]], colWidths=['100%'])
    ai_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e0e7ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#312e81')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 15),
        ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor('#818cf8'))
    ]))
    
    elements.append(ai_table)
    elements.append(PageBreak())
    
    # Page 2: Data Table
    elements.append(Paragraph("Detailed Data", header_style))
    
    raw_rows = data.get("raw_rows", [])
    if raw_rows:
        # Extract headers
        headers = list(raw_rows[0].keys())
        table_data = [headers]
        
        # Extract rows (limit to 100 for PDF to avoid massive files)
        for row in raw_rows[:100]:
            table_data.append([str(row.get(h, ""))[:40] for h in headers]) # Truncate long strings
            
        # Create Table
        # Auto column widths are tricky in reportlab without specifying them, but Table without colWidths does an OK job for few columns
        data_table = Table(table_data)
        data_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f1f5f9')])
        ]))
        
        elements.append(data_table)
        if len(raw_rows) > 100:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(f"* Showing first 100 of {len(raw_rows)} rows.", normal_style))
    else:
        elements.append(Paragraph("No data available for this period.", normal_style))
        
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
