## Run data fetching server and user location server
1. Run data fetching server

```
SSH vm
screen -R iot
python3 receiveData.py
ctrl+A+D
```
1. Run user location server
```
cd webService
sudo FLASK_APP=app.py flask run --host=0.0.0.0 --port=80 &
```