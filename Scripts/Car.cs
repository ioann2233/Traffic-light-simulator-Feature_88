using UnityEngine;

public class Car : MonoBehaviour
{
    private TrafficSimulation.Lane currentLane;
    private float speed;
    private float minDistanceToNextCar = 3f;

    public void Initialize(TrafficSimulation.Lane lane, float initialSpeed)
    {
        currentLane = lane;
        speed = initialSpeed;

        Vector3 direction = (lane.endPoint - lane.startPoint).normalized;
        transform.forward = direction;
    }

    private void Update()
    {
        float distanceToNextCar = CheckDistanceToNextCar();

        if (distanceToNextCar > minDistanceToNextCar && currentLane.trafficLight.IsGreen())
        {
            Vector3 movement = transform.forward * speed * Time.deltaTime;
            transform.position += movement;
        }
    }

    private float CheckDistanceToNextCar()
    {
        float minDistance = 100f;
        foreach (Car car in currentLane.carsInLane)
        {
            if (car == this) continue;

            float distance = Vector3.Distance(transform.position, car.transform.position);
            if (distance < minDistance && 
                Vector3.Dot(transform.forward, car.transform.position - transform.position) > 0)
            {
                minDistance = distance;
            }
        }
        return minDistance;
    }

    public bool ReachedDestination()
    {
        return Vector3.Distance(transform.position, currentLane.endPoint) < 0.1f;
    }

    public float GetSpeed()
    {
        return speed;
    }
} 