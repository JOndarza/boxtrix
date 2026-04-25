using ACadSharp.Entities;
using ACadSharp.IO;

namespace BoxTrix.Application.Services;

public sealed class DxfAreaParserService
{
    public IReadOnlyList<AreaImportResult> Parse(Stream dxfStream, decimal defaultHeight)
    {
        using var reader = new DxfReader(dxfStream);

        // Suppress reader notifications — unknown entities are expected in real-world files
        reader.OnNotification += (_, _) => { };

        var doc = reader.Read();
        var results = new List<AreaImportResult>();
        int counter = 1;

        foreach (var poly in doc.Entities.OfType<LwPolyline>())
        {
            if (!poly.IsClosed || poly.Vertices.Count < 3)
                continue;

            var xs = poly.Vertices.Select(v => (decimal)v.Location.X).ToList();
            var ys = poly.Vertices.Select(v => (decimal)v.Location.Y).ToList();

            decimal width = xs.Max() - xs.Min();
            decimal depth = ys.Max() - ys.Min();

            if (width <= 0 || depth <= 0)
                continue;

            string layerName = poly.Layer?.Name ?? string.Empty;
            string name = layerName.Length > 0 && layerName != "0"
                ? layerName
                : $"Area {counter}";

            results.Add(new AreaImportResult(name, width, depth, defaultHeight));
            counter++;
        }

        return results;
    }
}
