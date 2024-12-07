using UnityEngine;

public class RLAgent : MonoBehaviour
{
    private float[] qTable;
    private float learningRate = 0.1f;
    private float discountFactor = 0.95f;
    private float explorationRate = 0.1f;

    public void Initialize(int stateCount, int actionCount)
    {
        qTable = new float[stateCount * actionCount];
    }

    public int GetAction(int state)
    {
        if (Random.value < explorationRate)
        {
            return Random.Range(0, 4); // Случайное действие
        }

        // Выбираем действие с максимальным Q-значением
        float maxQ = float.MinValue;
        int bestAction = 0;

        for (int action = 0; action < 4; action++)
        {
            float q = qTable[state * 4 + action];
            if (q > maxQ)
            {
                maxQ = q;
                bestAction = action;
            }
        }

        return bestAction;
    }

    public void UpdateQValue(int state, int action, float reward, int nextState)
    {
        float currentQ = qTable[state * 4 + action];
        float maxNextQ = GetMaxQValue(nextState);

        qTable[state * 4 + action] = currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);
    }

    private float GetMaxQValue(int state)
    {
        float maxQ = float.MinValue;
        for (int action = 0; action < 4; action++)
        {
            float q = qTable[state * 4 + action];
            if (q > maxQ)
            {
                maxQ = q;
            }
        }
        return maxQ;
    }
} 