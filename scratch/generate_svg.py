import os

svg_template = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1240" width="1280" height="1240">
  <defs>
    <style>
      text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      
      .main-bg { fill: #0f172a; }
      .swimlane { fill: #1e293b; opacity: 0.6; stroke: #334155; stroke-width: 1; rx: 16; }
      .box { fill: #334155; stroke: #475569; stroke-width: 2; rx: 12; }
      .box-text-title { fill: #ffffff; font-size: 15px; font-weight: 600; }
      .box-text-sub { fill: #cbd5e1; font-size: 12.5px; font-weight: 400; }
      .swimlane-title { fill: #ffffff; font-size: 18px; font-weight: 700; text-anchor: middle; letter-spacing: 0.5px; }
      .swimlane-sub { fill: #94a3b8; font-size: 13px; font-weight: 500; text-anchor: middle; text-transform: uppercase; letter-spacing: 1px; }
      
      .icon-primary { fill: none; stroke: #818cf8; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .icon-success { fill: none; stroke: #34d399; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .icon-warning { fill: none; stroke: #fbbf24; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      
      .path-solid { fill: none; stroke: #818cf8; stroke-width: 3; marker-end: url(#arrow-solid); }
      .path-dashed { fill: none; stroke: #64748b; stroke-width: 2; stroke-dasharray: 6 6; marker-end: url(#arrow-dashed); }
      .path-qdrant { fill: none; stroke: #818cf8; stroke-width: 2; stroke-dasharray: 6 6; marker-end: url(#arrow-solid); }

      .trace-panel { fill: #1e293b; stroke: #475569; stroke-width: 2; rx: 12; }
      .trace-header { fill: #ffffff; font-size: 16px; font-weight: 600; }
      .trace-sub { fill: #94a3b8; font-size: 12px; }
      .metric-label { fill: #cbd5e1; font-size: 13.5px; }
      .metric-val-green { fill: #34d399; font-size: 13.5px; font-weight: 600; text-anchor: end; }
      .metric-val-indigo { fill: #818cf8; font-size: 13.5px; font-weight: 600; text-anchor: end; }
      .metric-val-amber { fill: #fbbf24; font-size: 13.5px; font-weight: 600; text-anchor: end; }
      
      .title { fill: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
      .subtitle { fill: #94a3b8; font-size: 16px; }
    </style>
    
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1"/>
    </pattern>
    
    <marker id="arrow-solid" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
    </marker>
    <marker id="arrow-dashed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
    </marker>
    
    <filter id="glow-particle" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComponentTransfer in="blur" result="glow">
        <feFuncA type="linear" slope="1.5" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="box-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComponentTransfer in="blur" result="glow">
        <feFuncA type="linear" slope="1.0" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="1240" class="main-bg" />
  <rect width="1280" height="1240" fill="url(#grid)" />

  <!-- Header -->
  <text class="title" x="40" y="55">source-stream</text>
  <text class="subtitle" x="40" y="80">RAG Architecture Pipeline</text>

  <!-- Swimlanes -->
  <!-- Col 1 -->
  <rect class="swimlane" x="40" y="100" width="360" height="710" />
  <text class="swimlane-sub" x="220" y="130">Section 1</text>
  <text class="swimlane-title" x="220" y="152">Knowledge Ingestion</text>

  <!-- Col 2 -->
  <rect class="swimlane" x="440" y="100" width="360" height="970" />
  <text class="swimlane-sub" x="620" y="130">Section 2</text>
  <text class="swimlane-title" x="620" y="152">Query Processing</text>

  <!-- Col 3 -->
  <rect class="swimlane" x="840" y="100" width="360" height="1100" />
  <text class="swimlane-sub" x="1020" y="130">Section 3</text>
  <text class="swimlane-title" x="1020" y="152">Response Validation</text>

  <!-- Solid Arrows with particles -->
  {solid_arrows}
  
  <!-- Dashed Arrows with particles -->
  {dashed_arrows}

  <!-- Boxes -->
  {boxes}

  <!-- Execution Trace Panel -->
  <g transform="translate(860, 190)">
    <rect class="trace-panel" width="320" height="610" />
    <text class="trace-header" x="20" y="35">Execution Trace</text>
    <text class="trace-sub" x="20" y="55">Monitoring &amp; Telemetry</text>
    <line x1="0" y1="75" x2="320" y2="75" stroke="#475569" stroke-width="1" />
    
    {trace_metrics}
  </g>
</svg>"""

def create_solid_arrow(d_path):
    return f"""
  <path class="path-solid" d="{d_path}" />
  <circle r="4.5" fill="#ffffff" filter="url(#glow-particle)">
    <animateMotion dur="2.5s" repeatCount="indefinite" path="{d_path}" />
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="2.5s" repeatCount="indefinite" />
  </circle>"""

def create_dashed_arrow(d_path, is_qdrant=False):
    cls = "path-qdrant" if is_qdrant else "path-dashed"
    color = "#ffffff" if is_qdrant else "#f8fafc"
    r = "4.5" if is_qdrant else "3.5"
    return f"""
  <path class="{cls}" d="{d_path}" />
  <circle r="{r}" fill="{color}" filter="url(#glow-particle)">
    <animateMotion dur="3s" repeatCount="indefinite" path="{d_path}" />
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="3s" repeatCount="indefinite" />
  </circle>"""

solid_arrows = "".join([
    create_solid_arrow("M 220 280 L 220 357"),
    create_solid_arrow("M 220 453 L 220 530"),
    create_solid_arrow("M 220 626 L 220 704"),
    create_solid_arrow("M 620 280 L 620 314"),
    create_solid_arrow("M 620 410 L 620 444"),
    create_solid_arrow("M 620 540 L 620 574"),
    create_solid_arrow("M 620 670 L 620 704"),
    create_solid_arrow("M 620 800 L 620 834"),
    create_solid_arrow("M 620 930 L 620 964"),
    create_solid_arrow("M 780 1015 L 854 1015"),
    create_solid_arrow("M 1020 1060 L 1020 1094")
])

dashed_arrows = "".join([
    create_dashed_arrow("M 380 755 L 454 755", True),
    create_dashed_arrow("M 780 365 L 854 365"),
    create_dashed_arrow("M 780 495 L 854 495"),
    create_dashed_arrow("M 780 625 L 854 625"),
    create_dashed_arrow("M 780 755 L 854 755")
])

icon_docs = """
<g>
  <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2.5; 0 0" dur="4s" repeatCount="indefinite" />
  <path class="icon-primary" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M12 18v-6 M9 15l3-3 3 3" />
  <path class="icon-primary" d="M14 2v6h6">
    <animate attributeName="stroke" values="#818cf8; #ffffff; #818cf8" dur="4s" repeatCount="indefinite" />
    <animate attributeName="stroke-width" values="2; 3.5; 2" dur="4s" repeatCount="indefinite" />
  </path>
</g>
"""

icon_chunking = """
<g class="icon-primary">
  <rect x="9" y="8" width="6" height="8" rx="1" />
  <rect x="2" y="8" width="6" height="8" rx="1">
    <animate attributeName="x" values="4; 0; 4" dur="3s" repeatCount="indefinite" />
  </rect>
  <rect x="16" y="8" width="6" height="8" rx="1">
    <animate attributeName="x" values="14; 18; 14" dur="3s" repeatCount="indefinite" />
  </rect>
</g>
"""

icon_gemini = """
<g class="icon-primary">
  <g>
    <animateTransform attributeName="transform" type="rotate" values="0 12 12; 45 12 12; 0 12 12" dur="8s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.7; 1; 0.7" dur="4s" repeatCount="indefinite" />
    <path d="M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83" />
  </g>
  <circle cx="12" cy="12" r="2" fill="#818cf8" stroke="none">
    <animate attributeName="r" values="2; 4; 2" dur="4s" repeatCount="indefinite" />
    <animate attributeName="fill" values="#818cf8; #ffffff; #818cf8" dur="4s" repeatCount="indefinite" />
  </circle>
</g>
"""

icon_qdrant = """
<g>
  <animateTransform attributeName="transform" type="rotate" values="-10 12 12; 10 12 12; -10 12 12" dur="7s" repeatCount="indefinite" />
  <path class="icon-primary" d="M2 12a10 4 0 0 0 20 0 M2 12a10 4 0 0 1 20 0 M2 12v8a10 4 0 0 0 20 0v-8 M2 6a10 4 0 0 0 20 0 M2 6a10 4 0 0 1 20 0" />
  <line x1="2" x2="22" y1="6" y2="6" stroke="#ffffff" stroke-width="2" opacity="0.8">
    <animate attributeName="y1" values="2; 22; 2" dur="4.5s" repeatCount="indefinite" />
    <animate attributeName="y2" values="2; 22; 2" dur="4.5s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0; 0.9; 0.9; 0" keyTimes="0; 0.15; 0.85; 1" dur="4.5s" repeatCount="indefinite" />
  </line>
</g>
"""

icon_user = """
<g transform="translate(12, 12)">
  <g>
    <animateTransform attributeName="transform" type="scale" values="0.97; 1.05; 0.97" dur="4s" repeatCount="indefinite" />
    <path class="icon-primary" d="M8 9v-2a4 4 0 0 0-4-4H-4a4 4 0 0 0-4 4v2 M0-9a4 4 0 1 0 0 8 4 4 0 1 0 0-8z" />
  </g>
</g>
"""

icon_guardrail = """
<g transform="translate(12, 11)">
  <g>
    <animateTransform attributeName="transform" type="scale" values="0.96; 1.05; 0.96" dur="3s" repeatCount="indefinite" />
    <path class="icon-warning" d="M0 11s8-4 8-10V-6l-8-3-8 3v7c0 6 8 10 8 10z">
      <animate attributeName="stroke" values="#fbbf24; #fef3c7; #fbbf24" dur="3s" repeatCount="indefinite" />
      <animate attributeName="stroke-width" values="2; 4; 2" dur="3s" repeatCount="indefinite" />
    </path>
  </g>
</g>
"""

icon_router = """
<g>
  <animateTransform attributeName="transform" type="rotate" values="-8 12 12; 8 12 12; -8 12 12" dur="6s" repeatCount="indefinite" />
  <path class="icon-primary" d="M6 3v12 M18 6l-12 12" />
  <circle cx="18" cy="6" r="3" class="icon-primary">
    <animate attributeName="fill" values="#818cf8; #1e293b; #818cf8" dur="3s" repeatCount="indefinite" />
    <animate attributeName="stroke-width" values="2; 3; 2" dur="3s" repeatCount="indefinite" />
  </circle>
  <circle cx="6" cy="18" r="3" class="icon-primary">
    <animate attributeName="fill" values="#1e293b; #818cf8; #1e293b" dur="3s" repeatCount="indefinite" />
    <animate attributeName="stroke-width" values="2; 3; 2" dur="3s" repeatCount="indefinite" />
  </circle>
</g>
"""

icon_search = """
<g>
  <path class="icon-primary" d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35" />
  <circle cx="11" cy="11" r="2" fill="none" stroke="#818cf8" stroke-width="2.5">
    <animate attributeName="r" values="2; 18" dur="2.5s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1; 0" dur="2.5s" repeatCount="indefinite" />
  </circle>
</g>
"""

icon_prompt = """
<g>
  <path class="icon-primary" d="M8 6l-6 6 6 6">
    <animate attributeName="stroke" values="#818cf8; #ffffff; #818cf8; #818cf8" keyTimes="0; 0.25; 0.5; 1" dur="3s" repeatCount="indefinite" />
    <animate attributeName="stroke-width" values="2; 3.5; 2; 2" keyTimes="0; 0.25; 0.5; 1" dur="3s" repeatCount="indefinite" />
  </path>
  <path class="icon-primary" d="M14 4l-4 16" />
  <path class="icon-primary" d="M16 18l6-6-6-6">
    <animate attributeName="stroke" values="#818cf8; #818cf8; #ffffff; #818cf8" keyTimes="0; 0.5; 0.75; 1" dur="3s" repeatCount="indefinite" />
    <animate attributeName="stroke-width" values="2; 2; 3.5; 2" keyTimes="0; 0.5; 0.75; 1" dur="3s" repeatCount="indefinite" />
  </path>
</g>
"""

icon_generation = """
<g>
  <path class="icon-primary" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z">
    <animate attributeName="opacity" values="1; 0.5; 1; 0.2; 1; 0.8; 1" dur="2s" repeatCount="indefinite" />
    <animate attributeName="fill" values="rgba(129,140,248,0.1); rgba(129,140,248,0.6); rgba(129,140,248,0.1)" dur="2s" repeatCount="indefinite" />
    <animate attributeName="stroke" values="#818cf8; #ffffff; #818cf8" dur="2s" repeatCount="indefinite" />
  </path>
</g>
"""

icon_eval = """
<g>
  <path class="icon-success" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  <g transform="translate(12, 12)">
    <g>
      <animateTransform attributeName="transform" type="scale" values="0.85; 1.35; 0.85" dur="2s" repeatCount="indefinite" />
      <path class="icon-success" stroke-width="3" d="M-3 0l2 2 4-4">
        <animate attributeName="stroke" values="#34d399; #ffffff; #34d399" dur="2s" repeatCount="indefinite" />
      </path>
    </g>
  </g>
</g>
"""

icon_response = """
<g>
  <path class="icon-success" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z">
    <animate attributeName="opacity" values="0.8; 1; 0.8" dur="3s" repeatCount="indefinite" />
  </path>
  <path class="icon-success" stroke-width="2.5" d="M9 12l2 2 4-4">
    <animate attributeName="stroke" values="#34d399; #ffffff; #34d399" dur="3s" repeatCount="indefinite" />
    <animate attributeName="stroke-width" values="2.5; 4.5; 2.5" dur="3s" repeatCount="indefinite" />
  </path>
</g>
"""

def render_box(x, y, title, sub1, sub2, icon_svg_content, ai_glow=False, response_fade=False):
    box_h = 90
    
    if sub1 and sub2:
        ty1, ty2, ty3 = 35, 58, 78
    elif sub1:
        ty1, ty2, ty3 = 40, 65, 0
    else:
        ty1, ty2, ty3 = 50, 0, 0
        
    res = f'  <g transform="translate({x}, {y})"'
    if response_fade:
        res += ' opacity="0">\n'
        res += '    <animate attributeName="opacity" values="0; 1; 1" keyTimes="0; 0.7; 1" dur="10s" repeatCount="indefinite" />\n'
    else:
        res += '>\n'
        
    if ai_glow:
        res += f'    <rect width="320" height="{box_h}" rx="12" fill="none" stroke="#818cf8" stroke-width="6" filter="url(#box-glow-blue)">\n'
        res += f'      <animate attributeName="opacity" values="0.3; 1; 0.3" dur="5s" repeatCount="indefinite" />\n'
        res += f'    </rect>\n'
        
    res += f'    <rect class="box" width="320" height="{box_h}" />\n'
    res += f'    <g transform="translate(20, 26)">\n'
    res += f'      <g transform="scale(1.4)">\n'
    res += f'        {icon_svg_content}\n'
    res += f'      </g>\n'
    res += f'    </g>\n'
    res += f'    <text class="box-text-title" x="70" y="{ty1}">{title}</text>\n'
    if sub1:
        res += f'    <text class="box-text-sub" x="70" y="{ty2}">{sub1}</text>\n'
    if sub2:
        res += f'    <text class="box-text-sub" x="70" y="{ty3}">{sub2}</text>\n'
    res += f'  </g>\n'
    return res

boxes_html = []

# Col 1
boxes_html.append(render_box(60, 190, "Document Sources", "TXT, PDF", "Documentation Website", icon_docs))
boxes_html.append(render_box(60, 363, "Recursive Text Chunking", "", "", icon_chunking))
boxes_html.append(render_box(60, 536, "Gemini Embeddings", "models/gemini-embedding-001", "3072-dimensional vectors", icon_gemini, ai_glow=True))
boxes_html.append(render_box(60, 710, "Qdrant Cloud", "Cosine Similarity", "HNSW Index", icon_qdrant))

# Col 2
boxes_html.append(render_box(460, 190, "User Question", "Natural Language Input", "", icon_user))
boxes_html.append(render_box(460, 320, "Input Guardrail", "Groq Llama 3.1 8B", "Prompt Injection, Toxicity Detection", icon_guardrail))
boxes_html.append(render_box(460, 450, "Query Intent Router", "Groq Llama 3.1 8B", "Determines if retrieval is required", icon_router, ai_glow=True))
boxes_html.append(render_box(460, 580, "Query Embedding", "Gemini Embeddings", "", icon_gemini, ai_glow=True))
boxes_html.append(render_box(460, 710, "Qdrant Similarity Search", "Top K Retrieval", "", icon_search))
boxes_html.append(render_box(460, 840, "Prompt Construction", "LCEL", "Context Injection", icon_prompt))
boxes_html.append(render_box(460, 970, "Answer Generation", "Groq Llama 3.1", "", icon_generation, ai_glow=True))

# Col 3
boxes_html.append(render_box(860, 970, "Groundedness Evaluation", "Groq Llama 3.1", "Compares answer vs retrieved context", icon_eval, ai_glow=True))
boxes_html.append(render_box(860, 1100, "Grounded Response", "Answer", "Source Citations", icon_response, response_fade=True))


def trace_item(y_offset, label, val_cls, val_text, step_idx, is_divider=False):
    if is_divider:
        return f'    <line x1="20" y1="{y_offset}" x2="300" y2="{y_offset}" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>\n'
    
    active_start = step_idx * 0.1
    active_end = (step_idx + 1) * 0.1
    start_transition = max(0, active_start - 0.01)
    end_transition = min(1, active_end + 0.01)
    
    keyTimes = f"0; {start_transition:.3f}; {active_start:.3f}; {active_end:.3f}; {end_transition:.3f}; 1"
    values = "0.3; 0.3; 1; 1; 0.3; 0.3"
    
    color = "#34d399" if val_cls == "metric-val-green" else ("#818cf8" if val_cls == "metric-val-indigo" else "#fbbf24")
    
    res = f'    <g transform="translate(20, {y_offset})" opacity="0.3">\n'
    res += f'      <animate attributeName="opacity" values="{values}" keyTimes="{keyTimes}" dur="10s" repeatCount="indefinite" />\n'
    res += f'      <circle cx="5" cy="-4" r="4.5" fill="{color}" />\n'
    res += f'      <text class="metric-label" x="20" y="0">{label}</text>\n'
    res += f'      <text class="{val_cls}" x="280" y="0">{val_text}</text>\n'
    res += f'    </g>\n'
    return res

trace_metrics_html = "".join([
    trace_item(110, "Input Guardrail", "metric-val-green", "45ms", 1),
    trace_item(145, "Query Router", "metric-val-green", "32ms", 2),
    trace_item(180, "Embedding", "metric-val-green", "120ms", 3),
    trace_item(215, "Vector Search", "metric-val-green", "85ms", 4),
    trace_item(245, "", "", "", 0, is_divider=True),
    trace_item(275, "Prompt Tokens", "metric-val-indigo", "1024", 5),
    trace_item(310, "Completion Tokens", "metric-val-indigo", "256", 6),
    trace_item(340, "", "", "", 0, is_divider=True),
    trace_item(370, "Retrieval Latency", "metric-val-green", "180ms", 4),
    trace_item(405, "Generation Latency", "metric-val-amber", "850ms", 6),
    trace_item(435, "", "", "", 0, is_divider=True),
    trace_item(465, "Groundedness Check", "metric-val-green", "Passed", 7)
])

final_svg = svg_template.replace("{solid_arrows}", solid_arrows)\
                        .replace("{dashed_arrows}", dashed_arrows)\
                        .replace("{boxes}", "\n".join(boxes_html))\
                        .replace("{trace_metrics}", trace_metrics_html)

with open('/Volumes/BrainStorm/Github/GenAI/source-stream/docs/images/rag-pipeline.svg', 'w') as f:
    f.write(final_svg)
