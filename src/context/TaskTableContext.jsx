import React, { createContext, useContext, useState } from 'react';

const TaskTableContext = createContext();

export const TaskTableProvider = ({ children }) => {
  const [taskTableOpen, setTaskTableOpen] = useState(false);
  return (
    <TaskTableContext.Provider value={{ taskTableOpen, setTaskTableOpen }}>
      {children}
    </TaskTableContext.Provider>
  );
};

export const useTaskTable = () => useContext(TaskTableContext);