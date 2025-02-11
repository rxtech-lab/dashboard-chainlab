import React from "react";

const ErrorComponent = ({ message }: { message: string }) => {
  return (
    <div className="px-4 py-3 rounded relative text-red-500" role="alert">
      <strong className="font-bold text-3xl">Error!</strong>
      <br />
      <span className="block sm:inline text-lg">{message}</span>
    </div>
  );
};

export default ErrorComponent;
