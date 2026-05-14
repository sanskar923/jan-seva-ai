from flask import Flask, request, jsonify
import tensorflow.lite as tflite
import numpy as np
from PIL import Image
from exif import Image as ExifImage 
import os
import random 

app = Flask(__name__)

# --- PREVIOUS CONFIGURATION ---
MODEL_PATH = 'governance_model.tflite'
CLASSES = ['Electricity', 'Road', 'Water']

# --- ADVANCED BILINGUAL BRAIN: English & Hindi Support ---
# Each intent now has responses mapped to language codes
INTENTS = {
    "greetings": {
        "patterns": ["hi", "hello", "namaste", "hey", "seva bot", "bhai"],
        "responses": {
            "en": "Namaste! 🙏 I'm your SevaBot. I'm here to work with you to keep Bhopal clean and safe. What issue can we solve together today?",
            "hi": "Namaste! 🙏 Main hoon aapka SevaBot. Bhopal ko behtar banane mein main aapka saathi hoon. Aaj hum milkar kis samasya ko suljhayen?"
        }
    },
    "electricity": {
        "patterns": ["light", "current", "bijli", "power cut", "meter", "khamba", "street light"],
        "responses": {
            "en": "I understand how frustrating power issues are. ⚡ I've identified this as an Electricity problem. To get this fixed fast, please use the **Live AI Vision camera below** to capture a photo of the pole or meter now.",
            "hi": "Bijli ki samasya kafi pareshan karti hai. ⚡ Maine ise 'Electricity Issue' ke roop mein pehchaan liya hai. Ise jaldi theek karne ke liye, kripya neeche diye gaye **'Live AI Vision' camera** se ek photo click karein."
        }
    },
    "water": {
        "patterns": ["pani", "water", "leak", "pipe", "drain", "nal", "supply"],
        "responses": {
            "en": "Water is precious for our city. 💧 I've categorized this as a Water Issue. Let's get the repair team on it! Please **scroll up and use the Live AI Vision tool** to submit a report right now.",
            "hi": "Bhopal ke liye pani bahut keemti hai. 💧 Maine ise 'Water Issue' mein daal diya hai. Chaliye ise milkar report karte hain! Kripya **Live AI Vision tool ka upyog karein** aur abhi apni complaint register karein."
        }
    },
    "road": {
        "patterns": ["road", "pothole", "sadak", "gaddha", "damage"],
        "responses": {
            "en": "Safety first! 🛣️ Broken roads can cause accidents. I'm ready to help you file this. Please **capture a live photo of the pothole using the AI Vision camera** so the engineers know exactly where to go.",
            "hi": "Sadak ki suraksha sabse pehle! 🛣️ Maine ise 'Road Issue' mark kar diya hai. Main aapki poori madad karoonga. Kripya **AI Vision camera se gaddhe ki live photo lein** taaki engineers sahi jagah pahunch saken."
        }
    }
}

# (TFLite and Location logic starts here - NO CHANGES MADE TO THIS SECTION)
try:
    interpreter = tflite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print("✅ Jan Seva AI: Bilingual Brain Loaded Successfully")
except Exception as e:
    print(f"❌ Error: {e}")

def get_image_location(file_stream):
    try:
        file_stream.seek(0)
        img = ExifImage(file_stream)
        if img.has_exif and hasattr(img, "gps_latitude"):
            lat = img.gps_latitude[0] + (img.gps_latitude[1]/60) + (img.gps_latitude[2]/3600)
            lon = img.gps_longitude[0] + (img.gps_longitude[1]/60) + (img.gps_longitude[2]/3600)
            return {"lat": lat, "lon": lon}
    except:
        return None
    return None

@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files['image']
        coords = get_image_location(file)
        file.seek(0)
        img = Image.open(file.stream).convert('RGB').resize((224, 224))
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])[0]
        idx = np.argmax(predictions)
        is_local = True
        if coords:
            if not (23.0 < coords['lat'] < 23.5):
                is_local = False
        return jsonify({
            "category": CLASSES[idx],
            "confidence": float(predictions[idx]),
            "metadata": coords,
            "is_local_image": is_local
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- UPDATED: ADVANCED BILINGUAL CHATBOT ROUTE ---
@app.route('/chatbot', methods=['POST'])
def handle_text_query():
    try:
        data = request.get_json()
        user_message = data.get("message", "").lower()
        
        # 1. HEURISTIC LANGUAGE DETECTION
        # We detect the "vibe" by looking for common Hindi keywords
        hindi_keywords = ["pani", "sadak", "bijli", "gaddha", "bhai", "namaste", "kaise", "hai", "nahi", "karne"]
        user_is_speaking_hindi = any(word in user_message for word in hindi_keywords)
        lang_code = "hi" if user_is_speaking_hindi else "en"

        best_match = None
        highest_score = 0

        # 2. SEMANTIC PATTERN MATCHING
        for intent, content in INTENTS.items():
            score = 0
            for pattern in content["patterns"]:
                if pattern in user_message:
                    score += 1
            if score > highest_score:
                highest_score = score
                best_match = intent

        # 3. CONTEXTUAL RESPONSE GENERATION
        if best_match and highest_score > 0:
            # Pick a random response in the detected language
            return jsonify({
                "reply": random.choice(INTENTS[best_match]["responses"][lang_code]),
                "intent": best_match
            })

        # 4. BILINGUAL FALLBACK (REJECTION LOGIC)
        if lang_code == "hi":
            fallback = "Maaf kijiye, main sirf Bhopal ki civic problems (Bijli, Sadak, Pani) samajh sakta hoon. Kya main inme se kisi cheez mein madad karoon?"
        else:
            fallback = "I'm sorry, I am specifically trained to handle Bhopal's Road, Water, and Electricity issues. Could you tell me about a civic problem instead?"

        return jsonify({"reply": fallback})

    except Exception as e:
        return jsonify({"reply": "My conversational logic is re-syncing..."}), 500

if __name__ == '__main__':
    app.run(port=5001)