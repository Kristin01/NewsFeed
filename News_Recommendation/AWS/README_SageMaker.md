## news_recommendation
Recommend news with AWS SageMaker

### Setup Environment

1. Create a Notebook in Sagemaker (instance type c4.2xlarge, disksize 20GB) and run
2. Upload setup-aws.ipynb to the notebook and run all cells

It will download the code from github and download Google pre-trained word2vec model.

### Training

- Open train/train_aws.ipynb and run all

It will train a brand new model with Sagemaker and start an inference endpoint.
You will get an inference endpoint from Sagemaker. Note the inference endpoint from SageMaker-Inference (`inference_endpoint`).
You will also get news_df.pkl which contains the source news and will be used in inference web service.
It is already saved in S3 with path `nyu-cc-final-recommend-news/news_df.pkl`

### Start Recommendation Web Service

1. Create an EC2 (instance type c4.2xlarge, disksize 20GB, ubuntu, open 80 port, require external ip `external_ip`)
2. Run `git clone https://github.com/Kristin01/news_recommend.git`
3. Run `sudo python3 -m pip install -r requirements.txt` to install dependences
4. Rheck if redis-server is installed, otherwise run `sudo apt-get install redis-server`
5. Run `sudo python3 app.py &` to start the inference web service

### Start Recommendation Service

- Run `sudo python3 -m pip install boto3 sagemaker`
- Run `sudo ENDPOINT_NAME=${inference_endpoint} AWS_DEFAULT_REGION="us-east-1" python3 predict_aws.py` to start inference service

e.g.
```
sudo ENDPOINT_NAME="kmeans-2021-05-19-15-14-39-730" AWS_DEFAULT_REGION="us-east-1" python3 predict_aws.py
```

### Validation

1. At local chrome web brower, install RestMan
2. In the Host of RestMan, put the `external_ip`
3. In the Action of RestMan, put `POST`
4. In the body of RestMan, put `text = Bitcoin decreases in business`, `longitude = 40.495791`, `latitude = -74.254845`
5. Run and you should see recommended news in the response