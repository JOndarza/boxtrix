using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;

namespace BoxTrix.Application.Pipeline;

/// <summary>
/// Orchestrator. Wires the eleven specialised stages in sequence:
/// <code>
/// Normalizer -> AreaPreprocessor -> BoxSorter -> AreaSelector
///   (per area: LayerSlicer -> RotationOptimizer -> PositionFinder
///              -> StabilityValidator -> Compactor)
/// -> UnfittedCollector -> Denormalizer
/// </code>
/// Each stage is a single-responsibility class injected via DI. Swap any
/// one out without touching the others.
/// </summary>
public sealed class PackingPipeline : IPacker
{
    private readonly NormalizerStage _normalizer;
    private readonly AreaPreprocessorStage _areaPreprocessor;
    private readonly BoxSorterStage _boxSorter;
    private readonly AreaSelectorStage _areaSelector;
    private readonly UnfittedCollectorStage _unfittedCollector;
    private readonly DenormalizerStage _denormalizer;

    public PackingPipeline(
        NormalizerStage normalizer,
        AreaPreprocessorStage areaPreprocessor,
        BoxSorterStage boxSorter,
        AreaSelectorStage areaSelector,
        UnfittedCollectorStage unfittedCollector,
        DenormalizerStage denormalizer)
    {
        _normalizer = normalizer;
        _areaPreprocessor = areaPreprocessor;
        _boxSorter = boxSorter;
        _areaSelector = areaSelector;
        _unfittedCollector = unfittedCollector;
        _denormalizer = denormalizer;
    }

    public PipelineResponse Pack(PipelineRequest request)
    {
        var normalized = _normalizer.Normalize(request);
        var contexts = _areaPreprocessor.Preprocess(normalized.Areas);
        var sortedBoxes = _boxSorter.Sort(normalized.Boxes);

        var distribution = _areaSelector.Distribute(contexts, sortedBoxes, normalized.Options.MinSupportRatio);

        var organised = new List<OrganizedArea>(distribution.Areas);
        var unfittedArea = _unfittedCollector.Collect(distribution.Unfitted);
        if (unfittedArea is not null)
        {
            organised.Add(unfittedArea);
        }

        var contextById = contexts.ToDictionary(c => c.Source.Id, c => c);
        return _denormalizer.Denormalize(normalized.Id, normalized.Name, organised, contextById);
    }
}

public interface IPacker
{
    PipelineResponse Pack(PipelineRequest request);
}
