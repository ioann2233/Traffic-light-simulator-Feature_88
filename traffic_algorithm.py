class SmartTrafficLight:
    def __init__(self):
        self.min_green_time = 5  # seconds
        self.max_green_time = 30  # seconds
        self.yellow_time = 3  # seconds

    def calculate_green_time(self, traffic_data):
        """
        Calculate optimal green light duration based on traffic data
        
        Parameters:
        traffic_data: dict with keys 'ns' and 'ew', each containing:
            - count: number of vehicles
            - waiting: number of waiting vehicles
            - avg_speed: average speed of vehicles
        
        Returns:
        tuple: (ns_green_time, ew_green_time) in seconds
        """
        ns_data = traffic_data['ns']
        ew_data = traffic_data['ew']
        
        # Calculate congestion score for each direction
        ns_score = (ns_data['waiting'] * 2) + (1 / (ns_data['avg_speed'] + 0.1))
        ew_score = (ew_data['waiting'] * 2) + (1 / (ew_data['avg_speed'] + 0.1))
        
        # Calculate proportional green times
        total_score = ns_score + ew_score
        if total_score == 0:
            return self.min_green_time, self.min_green_time
            
        variable_time = self.max_green_time - self.min_green_time
        
        ns_green_time = min(
            self.max_green_time,
            self.min_green_time + (variable_time * (ns_score / total_score))
        )
        
        ew_green_time = min(
            self.max_green_time,
            self.min_green_time + (variable_time * (ew_score / total_score))
        )
        
        return ns_green_time, ew_green_time

    def get_cycle_sequence(self, traffic_data):
        """
        Generate a complete traffic light cycle sequence
        
        Returns:
        list: Sequence of states and durations
        """
        ns_green_time, ew_green_time = self.calculate_green_time(traffic_data)
        
        return [
            {'ns': 'green', 'ew': 'red', 'duration': ns_green_time},
            {'ns': 'yellow', 'ew': 'red', 'duration': self.yellow_time},
            {'ns': 'red', 'ew': 'green', 'duration': ew_green_time},
            {'ns': 'red', 'ew': 'yellow', 'duration': self.yellow_time}
        ]
