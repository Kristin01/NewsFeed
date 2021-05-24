import sys
import numpy as np
import pandas as pd
import re
import gc

from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer
from gensim.models import Word2Vec, KeyedVectors
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.patheffects as PathEffects
from tqdm import tqdm
tqdm.pandas()

from util import text_to_wordlist
from util import text2vec

from os import listdir
from os.path import isfile, join
import json
source_dir = sys.argv[1]
source_files = [join(source_dir, f) for f in listdir(source_dir) if isfile(join(source_dir, f))]
news_jsons = []
for f in source_files:
  news_jsons.append(json.loads(open(f).read()))
news_df = pd.json_normalize(news_jsons)
news_df['ori_text'] = news_df[['title', 'body']].agg(' '.join, axis=1)
news_df['words'] = news_df.ori_text.progress_apply(text_to_wordlist)

## Load Google pretrained model
model = KeyedVectors.load_word2vec_format('GoogleNews-vectors-negative300.bin', binary=True)
def gtext2vec(text):
    return text2vec(model,text)
news_df['vectors'] = news_df.words.progress_apply(gtext2vec)

## Clustering and generating scatter
X = np.concatenate(news_df['vectors'].values)
kmeans = KMeans(n_clusters=10)
kmeans.fit(X)
news_df['cluster'] = kmeans.predict(X)

## Save News
news_df = news_df.drop(["ori_text", "words"], axis=1)
news_df.to_pickle('news_df.pkl')

## Save Model 
import pickle
pkl_filename = "model.pkl"
with open(pkl_filename, 'wb') as file:
    pickle.dump(kmeans, file)
