

import re
import json

try:
    with open('E:\\Imágenes\\Git\\GogoApp\\public\\Novedades.htm', 'r', encoding='utf-8') as f:
        html_content = f.read()

    products = []
    product_blocks = re.findall(r'<div class=\"itemProducto-.*?</div>\s*</div>', html_content, re.DOTALL)

    for block in product_blocks:
        product_data = {}
        url_match = re.search(r'<a class=\"img-producto\" href=\"(.*?)\">', block)
        if url_match:
            product_data['url'] = url_match.group(1)

        img_match = re.search(r'<img.*?src=\"(.*?)\".*?>', block)
        if img_match:
            product_data['imagen_url'] = img_match.group(1)

        name_match = re.search(r'<h3>(.*?)<a', block)
        if name_match:
            product_data['nombre'] = name_match.group(1).strip()

        ref_match = re.search(r'<p class=\"ref.*?\">(.*?)</p>', block)
        if ref_match:
            product_data['referencia'] = ref_match.group(1).strip()

        price_match = re.search(r'<p class=\"precio\">(.*?)</p>', block)
        if price_match:
            product_data['precio'] = price_match.group(1).replace('Precio Desde: ', '').strip()

        stock_match = re.search(r'<strong>Existencias</strong><span>(.*?)</span>', block)
        if stock_match:
            product_data['existencias'] = stock_match.group(1).strip()

        upcoming_match = re.search(r'<strong>Próximas llegadas</strong><span>(.*?)</span>', block)
        if upcoming_match:
            product_data['proximas_llegadas'] = upcoming_match.group(1).strip()

        if product_data.get('nombre'):
            products.append(product_data)

    with open('E:\\Imágenes\\Git\\GogoApp\\public\\productos.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)

    print("Archivo JSON creado exitosamente.")

except Exception as e:
    print(f"Ocurrió un error: {e}")

