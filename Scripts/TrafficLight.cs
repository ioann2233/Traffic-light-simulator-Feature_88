using UnityEngine;

public class TrafficLight : MonoBehaviour
{
    public enum State { Red, Yellow, Green }

    private GameObject redLight;
    private GameObject yellowLight;
    private GameObject greenLight;

    private State currentState = State.Red;
    private float stateDuration = 0f;
    private float yellowDuration = 2f;

    public void Initialize(GameObject red, GameObject yellow, GameObject green)
    {
        redLight = red;
        yellowLight = yellow;
        greenLight = green;
        UpdateVisuals();
    }

    public void SetState(State newState)
    {
        if (currentState != newState)
        {
            currentState = newState;
            stateDuration = 0f;
            UpdateVisuals();
        }
    }

    private void Update()
    {
        stateDuration += Time.deltaTime;

        if (currentState == State.Green && stateDuration > 10f)
        {
            SetState(State.Yellow);
        }
        else if (currentState == State.Yellow && stateDuration > yellowDuration)
        {
            SetState(State.Red);
        }
    }

    private void UpdateVisuals()
    {
        redLight.GetComponent<Renderer>().material.DisableKeyword("_EMISSION");
        yellowLight.GetComponent<Renderer>().material.DisableKeyword("_EMISSION");
        greenLight.GetComponent<Renderer>().material.DisableKeyword("_EMISSION");

        switch (currentState)
        {
            case State.Red:
                redLight.GetComponent<Renderer>().material.EnableKeyword("_EMISSION");
                break;
            case State.Yellow:
                yellowLight.GetComponent<Renderer>().material.EnableKeyword("_EMISSION");
                break;
            case State.Green:
                greenLight.GetComponent<Renderer>().material.EnableKeyword("_EMISSION");
                break;
        }
    }

    public bool IsGreen()
    {
        return currentState == State.Green;
    }
} 