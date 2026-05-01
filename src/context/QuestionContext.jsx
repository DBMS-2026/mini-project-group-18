import { createContext, useContext, useState } from "react";

const QuestionContext = createContext();

export const QuestionProvider = ({ children }) => {
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    return (
        <QuestionContext.Provider value={{ selectedQuestion, setSelectedQuestion }}>
            {children}
        </QuestionContext.Provider>
    );
};

export const useQuestion = () => useContext(QuestionContext);