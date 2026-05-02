# ═══════════════════════════════════════════════════════════
# DocSearch AI — Cloud Deployment Configurations
# AI & Cloud Computing Internship Project
# ═══════════════════════════════════════════════════════════

# ─── 1. Dockerfile (containerize the backend) ────────────────────────────
# Save as: Dockerfile
#
# FROM python:3.11-slim
# WORKDIR /app
# COPY backend/requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY backend/ .
# EXPOSE 5000
# CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]


# ─── 2. docker-compose.yml ───────────────────────────────────────────────
# Save as: docker-compose.yml
#
# version: "3.9"
# services:
#   api:
#     build: .
#     ports:
#       - "5000:5000"
#     environment:
#       - OPENAI_API_KEY=${OPENAI_API_KEY}
#       - PINECONE_API_KEY=${PINECONE_API_KEY}
#     volumes:
#       - ./uploads:/app/uploads
#   frontend:
#     image: node:20-alpine
#     working_dir: /app
#     volumes:
#       - ./frontend:/app
#     command: sh -c "npm install && npm start"
#     ports:
#       - "3000:3000"


# ─── 3. AWS Deployment (Elastic Beanstalk) ───────────────────────────────
# Install EB CLI: pip install awsebcli
# Then run:
#
#   eb init docsearch-ai --platform "Docker" --region us-east-1
#   eb create production
#   eb deploy
#
# Environment variables to set in AWS console:
#   OPENAI_API_KEY      → your OpenAI key
#   PINECONE_API_KEY    → your Pinecone key
#   PINECONE_INDEX      → docsearch-index
#   FLASK_ENV           → production


# ─── 4. GCP Cloud Run Deployment ─────────────────────────────────────────
# Prerequisites: gcloud CLI installed, project set up
#
# Step 1 — Build and push Docker image to Artifact Registry:
#   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/docsearch-api
#
# Step 2 — Deploy to Cloud Run:
#   gcloud run deploy docsearch-api \
#     --image gcr.io/YOUR_PROJECT_ID/docsearch-api \
#     --platform managed \
#     --region us-central1 \
#     --allow-unauthenticated \
#     --set-env-vars OPENAI_API_KEY=your_key,PINECONE_API_KEY=your_key
#
# Step 3 — Deploy frontend to Firebase Hosting:
#   npm run build   (from /frontend)
#   firebase deploy --only hosting


# ─── 5. Pinecone Vector DB Setup (Production) ────────────────────────────
# Replace mock embeddings in app.py with this:
#
# import pinecone
# from sentence_transformers import SentenceTransformer
#
# model = SentenceTransformer("all-MiniLM-L6-v2")
# pc = pinecone.Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
# index = pc.Index("docsearch-index")
#
# def embed_and_store(doc_id, text):
#     vector = model.encode(text).tolist()
#     index.upsert([(str(doc_id), vector, {"title": text[:80]})])
#
# def semantic_search(query, top_k=10):
#     vector = model.encode(query).tolist()
#     results = index.query(vector=vector, top_k=top_k, include_metadata=True)
#     return results.matches


# ─── 6. GitHub Actions CI/CD (.github/workflows/deploy.yml) ──────────────
# name: Deploy DocSearch AI
# on:
#   push:
#     branches: [main]
# jobs:
#   deploy:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v3
#       - name: Set up Python
#         uses: actions/setup-python@v4
#         with:
#           python-version: "3.11"
#       - name: Install dependencies
#         run: pip install -r backend/requirements.txt
#       - name: Run tests
#         run: python -m pytest backend/tests/
#       - name: Deploy to Cloud Run
#         uses: google-github-actions/deploy-cloudrun@v1
#         with:
#           service: docsearch-api
#           image: gcr.io/${{ secrets.GCP_PROJECT }}/docsearch-api
#           credentials_json: ${{ secrets.GCP_SA_KEY }}


echo "Cloud configuration reference file created."
