import sys
import os
import pandas as pd
import pickle
from gensim.models import KeyedVectors
import redis
import json
from util import text2vec
import time
import boto3
import sagemaker
from sagemaker import KMeansPredictor
sagemaker.Session(boto3.session.Session())

# grab environment variables
ENDPOINT_NAME = os.environ['ENDPOINT_NAME']
ACCESS_KEY = os.environ['ACCESS_KEY']
SECRET_KEY = os.environ['SECRET_KEY']

session = sagemaker.Session(boto3.session.Session(\
  aws_access_key_id=ACCESS_KEY,\
  aws_secret_access_key=SECRET_KEY))
kmeans_endpoint = KMeansPredictor(ENDPOINT_NAME, session)

PREDICT_Q="predict_q"
r = redis.Redis()

print("Loading Google pre-trained model")
import os.path
from os import path
if not path.exists("GoogleNews-vectors-negative300.bin"):
  os.system('wget -c "https://s3.amazonaws.com/dl4j-distribution/GoogleNews-vectors-negative300.bin.gz"')
  os.system("gzip -d GoogleNews-vectors-negative300.bin.gz")

model = KeyedVectors.load_word2vec_format('GoogleNews-vectors-negative300.bin', binary=True)

# define sagemaker K-means endpoint
print("define sagemaker K-means endpoint")
def sagemaker_kmeans_predict(vec):
    response = kmeans_endpoint.predict(vec)
    #print(response[0].label)
    return response[0].label.get("closest_cluster").float32_tensor.values[0]

def infer_cluster(text):
  vec = text2vec(model, text)
  return [sagemaker_kmeans_predict(vec), vec]
  
print("Loading news data source")
os.system("rm news_df.pkl")
os.system("curl -O https://nyu-cc-final-recommend-news.s3.amazonaws.com/news_df.pkl")
pkl_filename = "news_df.pkl"
with open(pkl_filename, 'rb') as file:
    news_df = pickle.load(file)

def recommend_news(user_info):
  longitude = user_info["long"]
  latitude = user_info["lat"]
  text = user_info["text"]
  if longitude == "-74.254845" and latitude == "40.495791":
    text = text + " New York"
  if longitude == "-77.040470" and latitude == "38.933776":
    text = text + " Washington D.C."
  if longitude == "-71.185923" and latitude == "42.236275":
    text = text + " Boston"
  [predicted_clustor, vec] = infer_cluster(text)
  res_news = []
  for index, row in news_df.iterrows():
    if row["cluster"] == predicted_clustor:
      news = {}
      news["title"] = row["title"]
      news["link"] = row["link"]
      news["body"] = row["body"]
      res_news.append(news)
      if len(res_news) > 10:
        break
  return str(predicted_clustor), res_news

print("Recommendation start up complete")
while True:
    rid = r.lpop(PREDICT_Q)
    if rid != None:
        print(rid)
        user_info = json.loads(r.get(rid).decode("utf-8"))
        rid = rid.decode("utf-8")
        print(user_info)
        # Calculate the accuracy score and predict target values
        [cluster, recommends] = recommend_news(user_info)
        print(cluster)
        print(recommends)
        res = json.dumps({"cluster": cluster, "news": recommends})
        r.set(rid + "res", res)
    time.sleep(0.1)