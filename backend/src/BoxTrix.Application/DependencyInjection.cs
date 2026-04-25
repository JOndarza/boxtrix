using BoxTrix.Application.Pipeline;
using BoxTrix.Application.Pipeline.Stages;
using Microsoft.Extensions.DependencyInjection;

namespace BoxTrix.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Registers every pipeline stage and the orchestrator. All stages are
    /// stateless, so singletons are safe and avoid per-request allocation.
    /// </summary>
    public static IServiceCollection AddBoxTrixApplication(this IServiceCollection services)
    {
        services.AddSingleton<NormalizerStage>();
        services.AddSingleton<AreaPreprocessorStage>();
        services.AddSingleton<BoxSorterStage>();
        services.AddSingleton<RotationOptimizerStage>();
        services.AddSingleton<StabilityValidatorStage>();
        services.AddSingleton<PositionFinderStage>();
        services.AddSingleton<LayerSlicerStage>();
        services.AddSingleton<CompactorStage>();
        services.AddSingleton<AreaSelectorStage>();
        services.AddSingleton<UnfittedCollectorStage>();
        services.AddSingleton<DenormalizerStage>();
        services.AddSingleton<IPacker, PackingPipeline>();
        return services;
    }
}
