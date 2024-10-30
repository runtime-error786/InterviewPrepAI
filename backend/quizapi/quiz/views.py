# import getpass
# import os

# if "GROQ_API_KEY" not in os.environ:
#     os.environ["GROQ_API_KEY"] = "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"

# from langchain_groq import ChatGroq
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status

# llm = ChatGroq(
#     model="llama-3.2-11b-text-preview",
#     temperature=0,
#     max_tokens=None,
#     timeout=None,
#     max_retries=2,
# )

# @api_view(['GET'])
# def generate_question(request):
#     try:
#         print("hello from generate question")
#         prompt = "Generate a theoretical interview question about data structures that tests a candidate's knowledge. The question should involve concepts like arrays, linked lists, stacks, queues, trees, or graphs. Provide only the question without any solutions or additional context."
        
#         question = llm.invoke(prompt) 
#         print(question.content)
#         return Response({"question": question.content}, status=status.HTTP_200_OK)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# @api_view(['POST'])
# def validate_answer(request):
#     try:
#         question = request.data.get('question')
#         answer = request.data.get('answer')
#         prompt = (
#         f"Question: {question}\n"
#         f"Answer: {answer}\n"
#         "Is the answer correct according to the question? Respond only with 'yes' or 'no'. "
#         "No explanations or additional text; only reply with 'yes' or 'no'. "
#         )

#         print(prompt)

#         response = llm.invoke(prompt) 
#         print(response.content)

#         cleaned_response = response.content.strip().lower()
        
#         if cleaned_response in ["yes", "no"]:
#             return Response({"is_correct": cleaned_response}, status=status.HTTP_200_OK)
#         else:
#             return Response({"error": "Response not valid. Expected 'yes' or 'no'."}, status=status.HTTP_400_BAD_REQUEST)

#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.1")

@api_view(['POST']) 
def generate_question(request):
    try:
        past_questions = request.data.get("past_questions", [])  
        print("Received past questions: ", past_questions)

        prompt = (
            "Generate a theoretical interview question about data structures that tests a candidate's knowledge. "
            "The question should involve concepts like arrays, linked lists, stacks, queues, trees, or graphs. "
            "Make sure to focus on questions where the candidate is expected to answer verbally, "
            "and avoid repeating any of these past questions:\n" + 
            "\n".join(past_questions) +
            "\nProvide only the question without any solutions or additional context."
        )

        question = llm.invoke(prompt)

        if question not in past_questions:
            past_questions.append(question)
        else:
            return Response({"error": "Duplicate question generated."}, status=status.HTTP_409_CONFLICT)

        return Response({"question": question, "past_questions": past_questions}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def validate_answer(request):
    try:
        question = request.data.get('question')
        answer = request.data.get('answer')

        prompt = (
            f"Question: {question}\n"
            f"Answer: {answer}\n"
            "Is the answer correct according to the question? Respond only with 'yes' or 'no'."
        )
        print(prompt)
        response = llm.invoke(prompt).strip().lower().rstrip('.').rstrip(',')
        is_correct = response in ["yes", "no"]

        if is_correct and response == "yes":
            message = f"Correct answer for: {question}"
        else:
            message = f"Incorrect answer for: {question}"

        print(message)

        return Response({"is_correct": response}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
