import os
from flask import Flask, jsonify
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Connect to your MongoDB Atlas cluster
client = MongoClient(os.getenv("ATLASDB_URL"))
db = client.get_database()
listings_collection = db["listings"]

# Load the pretrained embedding model once at startup (not per-request)
print("Loading sentence-transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded.")


def fetch_listings():
    return list(listings_collection.find({}))


def build_corpus(listings):
    corpus = []
    for l in listings:
        text = f"{l.get('title','')} {l.get('description','')} {l.get('location','')} {l.get('country','')}"
        corpus.append(text)
    return corpus


@app.route("/recommend/<listing_id>")
def recommend(listing_id):
    listings = fetch_listings()

    idx = None
    for i, l in enumerate(listings):
        if str(l["_id"]) == listing_id:
            idx = i
            break

    if idx is None:
        return jsonify({"error": "Listing not found"}), 404

    corpus = build_corpus(listings)

    # Generate semantic embeddings (this replaces TF-IDF)
    embeddings = model.encode(corpus)

    # Same cosine similarity logic as before
    similarity_matrix = cosine_similarity(embeddings)
    scores = list(enumerate(similarity_matrix[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    scores = [s for s in scores if s[0] != idx][:4]

    recommendations = []
    for i, score in scores:
        l = listings[i]
        recommendations.append({
            "_id": str(l["_id"]),
            "title": l.get("title"),
            "price": l.get("price"),
            "location": l.get("location"),
            "image": l.get("image", {}).get("url", ""),
            "similarity": round(float(score), 4)
        })

    return jsonify(recommendations)


if __name__ == "__main__":
    app.run(port=5001, debug=True)