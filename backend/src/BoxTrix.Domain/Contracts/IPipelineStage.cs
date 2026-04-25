namespace BoxTrix.Domain.Contracts;

/// <summary>
/// Marker interface. Stages are stateless; their public method takes the
/// concrete inputs the orchestrator passes them. There is no single Execute
/// signature because every stage has its own arity — keeping the orchestrator
/// explicit is preferred over a generic Execute(object) bag.
/// </summary>
public interface IPipelineStage
{
}
