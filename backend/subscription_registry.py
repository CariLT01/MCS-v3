from collections import defaultdict

class SubscriptionRegistry:
    def __init__(self):
        
        self.subscriptions = defaultdict(lambda: defaultdict(int))
        self.client_subscriptions = defaultdict(set) 
    
    def subscribe(self, stream: str, instance_id: int):
        print("subscribe ", stream, instance_id)
        self.subscriptions[stream][instance_id] += 1
    
    def unsubscribe(self, stream: str, instance_id: int):
        if instance_id in self.subscriptions[stream]:
            self.subscriptions[stream][instance_id] -= 1

            if self.subscriptions[stream][instance_id] <= 0:
                del self.subscriptions[stream][instance_id]

registry = SubscriptionRegistry()