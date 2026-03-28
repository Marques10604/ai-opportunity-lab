import React, { createContext, useContext, useState, ReactNode } from 'react';

type SelectedProblemContextType = {
  selectedProblem: any | null;
  selectedPipelineData: any | null;
  setSelectedProblem: (problem: any | null) => void;
  setSelectedPipelineData: (data: any | null) => void;
};

const SelectedProblemContext = createContext<SelectedProblemContextType | undefined>(undefined);

export function SelectedProblemProvider({ children }: { children: ReactNode }) {
  const [selectedProblem, setSelectedProblemInternal] = useState<any | null>(null);
  const [selectedPipelineData, setSelectedPipelineData] = useState<any | null>(null);

  const setSelectedProblem = (problem: any | null) => {
    setSelectedProblemInternal(problem);
    setSelectedPipelineData(null); // Limpar dados do pipeline ao trocar de problema
  };

  return (
    <SelectedProblemContext.Provider
      value={{ selectedProblem, selectedPipelineData, setSelectedProblem, setSelectedPipelineData }}
    >
      {children}
    </SelectedProblemContext.Provider>
  );
}

export function useSelectedProblem() {
  const context = useContext(SelectedProblemContext);
  if (context === undefined) {
    throw new Error('useSelectedProblem must be used within a SelectedProblemProvider');
  }
  return context;
}
