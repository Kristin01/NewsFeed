from flask import Flask
from flask import request
import redis
import time

app = Flask(__name__)
r = redis.Redis()

@app.route('/')
def index():
    return r.get("customer_loc")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)