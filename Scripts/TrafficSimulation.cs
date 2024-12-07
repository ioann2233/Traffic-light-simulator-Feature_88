using UnityEngine;
using System.Collections.Generic;

public class TrafficSimulation : MonoBehaviour
{
    [SerializeField] private GameObject carPrefab;
    [SerializeField] private GameObject roadPrefab; // Префаб дороги
    [SerializeField] private Material roadMarkingMaterial; // Материал для разметки

    private List<TrafficLight> trafficLights;
    private List<Car> cars;
    private List<Lane> lanes; // Список полос движения

    [System.Serializable]
    public class Lane
    {
        public Vector3 startPoint;
        public Vector3 endPoint;
        public bool isRightToLeft;
        public List<Car> carsInLane;
        public TrafficLight trafficLight;
    }

    private void Start()
    {
        trafficLights = new List<TrafficLight>();
        cars = new List<Car>();
        lanes = new List<Lane>();

        InitializeRoads();
        InitializeIntersection();
        InitializeRL();
    }

    private void InitializeRoads()
    {
        // Создаем горизонтальные дороги
        CreateRoad(new Vector3(-20, 0, 2), new Vector3(20, 0, 2), true); // Правая полоса
        CreateRoad(new Vector3(-20, 0, -2), new Vector3(20, 0, -2), false); // Левая полоса

        // Создаем вертикальные дороги
        CreateRoad(new Vector3(2, 0, -20), new Vector3(2, 0, 20), true); // Правая полоса
        CreateRoad(new Vector3(-2, 0, -20), new Vector3(-2, 0, 20), false); // Левая полоса
    }

    private void CreateRoad(Vector3 start, Vector3 end, bool isRightToLeft)
    {
        // Создаем полосу движения
        Lane lane = new Lane
        {
            startPoint = start,
            endPoint = end,
            isRightToLeft = isRightToLeft,
            carsInLane = new List<Car>()
        };
        lanes.Add(lane);

        // Создаем физическую дорогу
        GameObject road = Instantiate(roadPrefab);
        road.transform.position = (start + end) / 2f;
        road.transform.forward = (end - start).normalized;
        road.transform.localScale = new Vector3(1, 1, Vector3.Distance(start, end));

        // Добавляем разметку
        CreateRoadMarkings(start, end);

        // Создаем светофор
        CreateTrafficLight(lane, (start + end) / 2f);
    }

    private void CreateRoadMarkings(Vector3 start, Vector3 end)
    {
        float markingLength = 2f;
        float gapLength = 2f;
        Vector3 direction = (end - start).normalized;
        float totalDistance = Vector3.Distance(start, end);

        for (float distance = 0; distance < totalDistance; distance += markingLength + gapLength)
        {
            GameObject marking = GameObject.CreatePrimitive(PrimitiveType.Cube);
            marking.transform.localScale = new Vector3(0.1f, 0.01f, markingLength);
            marking.transform.position = start + direction * (distance + markingLength / 2f);
            marking.transform.forward = direction;
            marking.GetComponent<Renderer>().material = roadMarkingMaterial;
        }
    }

    private void CreateTrafficLight(Lane lane, Vector3 position)
    {
        // Создаем основу светофора
        GameObject tlObject = new GameObject("TrafficLight");
        tlObject.transform.position = position + Vector3.up * 5f;

        // Создаем корпус светофора
        GameObject housing = GameObject.CreatePrimitive(PrimitiveType.Cube);
        housing.transform.parent = tlObject.transform;
        housing.transform.localScale = new Vector3(0.5f, 1.5f, 0.5f);
        housing.transform.localPosition = Vector3.zero;
        housing.GetComponent<Renderer>().material.color = Color.gray;

        // Создаем красный свет
        GameObject redLight = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        redLight.transform.parent = tlObject.transform;
        redLight.transform.localScale = new Vector3(0.4f, 0.4f, 0.4f);
        redLight.transform.localPosition = new Vector3(0, 0.5f, 0);
        Material redMaterial = new Material(Shader.Find("Standard"));
        redMaterial.color = Color.red;
        redMaterial.EnableKeyword("_EMISSION");
        redMaterial.SetColor("_EmissionColor", Color.red * 2f);
        redLight.GetComponent<Renderer>().material = redMaterial;

        // Создаем желтый свет
        GameObject yellowLight = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        yellowLight.transform.parent = tlObject.transform;
        yellowLight.transform.localScale = new Vector3(0.4f, 0.4f, 0.4f);
        yellowLight.transform.localPosition = new Vector3(0, 0, 0);
        Material yellowMaterial = new Material(Shader.Find("Standard"));
        yellowMaterial.color = Color.yellow;
        yellowMaterial.EnableKeyword("_EMISSION");
        yellowMaterial.SetColor("_EmissionColor", Color.yellow * 2f);
        yellowLight.GetComponent<Renderer>().material = yellowMaterial;

        // Создаем зеленый свет
        GameObject greenLight = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        greenLight.transform.parent = tlObject.transform;
        greenLight.transform.localScale = new Vector3(0.4f, 0.4f, 0.4f);
        greenLight.transform.localPosition = new Vector3(0, -0.5f, 0);
        Material greenMaterial = new Material(Shader.Find("Standard"));
        greenMaterial.color = Color.green;
        greenMaterial.EnableKeyword("_EMISSION");
        greenMaterial.SetColor("_EmissionColor", Color.green * 2f);
        greenLight.GetComponent<Renderer>().material = greenMaterial;

        // Добавляем компонент TrafficLight и настраиваем его
        TrafficLight tl = tlObject.AddComponent<TrafficLight>();
        tl.Initialize(redLight, yellowLight, greenLight);

        // Поворачиваем светофор в зависимости от направления дороги
        Vector3 direction = (lane.endPoint - lane.startPoint).normalized;
        tlObject.transform.forward = direction;

        lane.trafficLight = tl;
        trafficLights.Add(tl);
    }

    private void SpawnCar(Lane lane)
    {
        if (cars.Count >= 20) return;

        GameObject carObj = Instantiate(carPrefab, lane.startPoint, Quaternion.identity);
        Car car = carObj.AddComponent<Car>();
        car.Initialize(lane, 10f);
        cars.Add(car);
        lane.carsInLane.Add(car);
    }

    private void Update()
    {
        if (Random.value < Time.deltaTime * 0.5f)
        {
            Lane randomLane = lanes[Random.Range(0, lanes.Count)];
            SpawnCar(randomLane);
        }

        cars.RemoveAll(car => car.ReachedDestination());

        UpdateTrafficLights();
    }

    private void UpdateTrafficLights()
    {
        foreach (Lane lane in lanes)
        {
            int carCount = lane.carsInLane.Count;
            float averageSpeed = 0f;

            if (carCount > 0)
            {
                foreach (Car car in lane.carsInLane)
                {
                    averageSpeed += car.GetSpeed();
                }
                averageSpeed /= carCount;
            }

            if (carCount > 3 || averageSpeed < 2f)
            {
                lane.trafficLight.SetState(TrafficLight.State.Green);
            }
            else if (lane.trafficLight.IsGreen() && carCount == 0)
            {
                lane.trafficLight.SetState(TrafficLight.State.Yellow);
            }
        }
    }
} 

</```rewritten_file>