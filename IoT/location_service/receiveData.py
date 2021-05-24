from google.api_core import retry
from google.cloud import pubsub_v1
import time
import redis

project_id = "keen-philosophy-314419"
subscription_id = "my-subscription"
NUM_MESSAGES = 10000
r = redis.Redis()

while True:
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)
    with subscriber:
        response = subscriber.pull(
            request={"subscription": subscription_path, "max_messages": NUM_MESSAGES},
            retry=retry.Retry(deadline=50001),
        )

        ack_ids = []
        for received_message in response.received_messages:
            print(f"Received: {received_message.message.data}.")
            ack_ids.append(received_message.ack_id)
            r.set("customer_loc", received_message.message.data)

        if len(ack_ids) > 0:
            subscriber.acknowledge(
                request={"subscription": subscription_path, "ack_ids": ack_ids}
            )
    time.sleep(30)