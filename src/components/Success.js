function Success() {
  return (
    <div className="flex flex-col gap-3 items-center align-middle justify-center">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
        Operazione completata con successo!
      </div>
      <img src="/bp.webp" alt="Baden Powell" width={"80%"} />
      <p className="lead">Baden Powell ti ringrazia!</p>
    </div>
  );
}

export default Success;
