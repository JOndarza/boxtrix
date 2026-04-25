using BoxTrix.Application;
using BoxTrix.Application.Pipeline;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BoxTrix.Application.Tests;

/// <summary>
/// Regression tests that exercise dense, heterogeneous inputs (similar to the
/// frontend demo) and assert no two placed boxes overlap. These complement the
/// fine-grained stage tests by stressing the full pipeline with realistic data.
/// </summary>
public sealed class PackingPipelineOverlapTests
{
    private readonly IPacker _packer;

    public PackingPipelineOverlapTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddBoxTrixApplication();
        _packer = services.BuildServiceProvider().GetRequiredService<IPacker>();
    }

    [Fact]
    public void Placed_boxes_never_overlap_in_the_demo_workload()
    {
        var request = new PipelineRequest(
            "demo", null,
            [
                AreaWithCorridor("Main Shelf", 120, 40, 35, Corner.BottomFrontRight,
                    corridor: (0m, 0m, 0m, 30m, 40m, 35m)),
                Area("Display Cabinet", 50, 90, 28, Corner.BottomFrontLeft),
                Area("Upper Shelf",     120, 25, 35, Corner.BottomBackLeft),
                Area("Flat Drawer",     80,  12, 50, Corner.BottomFrontLeft),
            ],
            DemoBoxes(),
            Options());

        var response = _packer.Pack(request);

        foreach (var area in response.Areas.Where(a => !a.Unplaced))
        {
            AssertNoOverlap(area);
        }
    }

    [Fact]
    public void Many_identical_boxes_in_a_single_area_never_overlap()
    {
        var boxes = new List<RequestBox>();
        for (int i = 0; i < 30; i++)
        {
            boxes.Add(Box($"b{i}", 14, 19, 10, weight: 0.30));
        }

        var request = new PipelineRequest(
            "stress", null,
            [Area("shelf", 120, 60, 35, Corner.BottomFrontLeft)],
            boxes,
            Options());

        var response = _packer.Pack(request);

        foreach (var area in response.Areas.Where(a => !a.Unplaced))
        {
            AssertNoOverlap(area);
        }
    }

    [Fact]
    public void Heterogeneous_box_sizes_in_one_area_never_overlap()
    {
        var request = new PipelineRequest(
            "mixed", null,
            [Area("shelf", 100, 60, 40, Corner.BottomFrontLeft)],
            [
                Box("tall",  10, 50, 10, weight: 0.5),
                Box("flat",  40, 5,  30, weight: 0.5),
                Box("cube",  20, 20, 20, weight: 0.5),
                Box("thin",  17, 26, 1,  weight: 0.15),
                Box("thin2", 17, 26, 1,  weight: 0.15),
                Box("wide",  60, 10, 30, weight: 1.0),
                Box("med",   25, 25, 15, weight: 0.4),
            ],
            Options());

        var response = _packer.Pack(request);

        foreach (var area in response.Areas.Where(a => !a.Unplaced))
        {
            AssertNoOverlap(area);
        }
    }

    private static void AssertNoOverlap(ResponseArea area)
    {
        var aabbs = area.Boxes.Select(b => DecimalAabb(b.Position, b.RotatedSize)).ToArray();
        for (int i = 0; i < aabbs.Length; i++)
        {
            for (int j = i + 1; j < aabbs.Length; j++)
            {
                bool overlap = DecimalOverlaps(aabbs[i], aabbs[j]);
                overlap.Should().BeFalse(
                    "boxes '{0}' (pos {1}, size {2}) and '{3}' (pos {4}, size {5}) must not overlap inside area '{6}'",
                    area.Boxes[i].Id, area.Boxes[i].Position, area.Boxes[i].RotatedSize,
                    area.Boxes[j].Id, area.Boxes[j].Position, area.Boxes[j].RotatedSize,
                    area.Id);
            }
        }
    }

    private static (decimal MinX, decimal MinY, decimal MinZ, decimal MaxX, decimal MaxY, decimal MaxZ) DecimalAabb(
        DecimalPosition pos, DecimalMeasurements size) =>
        (pos.X, pos.Y, pos.Z, pos.X + size.Width, pos.Y + size.Height, pos.Z + size.Depth);

    private static bool DecimalOverlaps(
        (decimal MinX, decimal MinY, decimal MinZ, decimal MaxX, decimal MaxY, decimal MaxZ) a,
        (decimal MinX, decimal MinY, decimal MinZ, decimal MaxX, decimal MaxY, decimal MaxZ) b) =>
        a.MinX < b.MaxX && a.MaxX > b.MinX &&
        a.MinY < b.MaxY && a.MaxY > b.MinY &&
        a.MinZ < b.MaxZ && a.MaxZ > b.MinZ;

    private static IReadOnlyList<RequestBox> DemoBoxes() =>
    [
        // Standard Funkos
        Box("Funko-Spider-Man", 14, 19, 10, weight: 0.30),
        Box("Funko-Batman",     14, 19, 10, weight: 0.30),
        Box("Funko-Iron-Man",   14, 19, 10, weight: 0.30),
        Box("Funko-Vader",      14, 19, 10, weight: 0.30),
        Box("Funko-Goku",       14, 22, 10, weight: 0.35),
        Box("Funko-Pikachu",    14, 16, 10, weight: 0.25),
        Box("Funko-Thanos",     14, 22, 10, weight: 0.40),
        Box("Funko-Deadpool",   14, 19, 10, weight: 0.30),
        Box("Funko-Wolverine",  14, 19, 10, weight: 0.30),
        // Comics
        Box("Comic-1", 17, 26, 1, weight: 0.15),
        Box("Comic-2", 17, 26, 1, weight: 0.15),
        Box("Comic-3", 17, 26, 1, weight: 0.15),
        Box("Comic-4", 17, 26, 1, weight: 0.15),
        // Misc
        Box("LEGO-Falcon",      26, 19, 6,  weight: 0.80),
        Box("Cube-MGS",         20, 20, 20, weight: 0.50),
        Box("BoardGame-Wingspan", 29, 8, 29, weight: 1.50),
    ];

    private static RequestArea Area(string id, decimal w, decimal h, decimal d, Corner corner) =>
        new(id, null, null,
            new DecimalMeasurements(w, h, d),
            new DecimalPosition(0, 0, 0),
            corner,
            ExitCorridor: null,
            MaxStackHeight: null);

    private static RequestArea AreaWithCorridor(string id, decimal w, decimal h, decimal d, Corner corner,
        (decimal x, decimal y, decimal z, decimal cw, decimal ch, decimal cd) corridor) =>
        new(id, null, null,
            new DecimalMeasurements(w, h, d),
            new DecimalPosition(0, 0, 0),
            corner,
            new RequestExitCorridor(
                new DecimalPosition(corridor.x, corridor.y, corridor.z),
                new DecimalMeasurements(corridor.cw, corridor.ch, corridor.cd)),
            MaxStackHeight: null);

    private static RequestBox Box(string id, decimal w, decimal h, decimal d, double weight) =>
        new(id, null, null, new DecimalMeasurements(w, h, d), weight);

    private static PackingOptions Options() =>
        new(Units.Cm, MinSupportRatio: 0.7);
}
