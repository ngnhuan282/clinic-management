using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json.Nodes;

// Exercises the real authenticated hub without depending on a second SignalR client package.
internal sealed class SignalRProbe : IAsyncDisposable
{
    private readonly ClientWebSocket socket = new();
    private readonly CancellationTokenSource stop = new();
    private readonly TaskCompletionSource handshake = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private readonly TaskCompletionSource closed = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private Task pump = Task.CompletedTask;
    public ConcurrentQueue<(string Name, JsonNode Payload)> Events { get; } = new();
    public int Count(string name = "DepartmentWorkflowChanged") => Events.Count(x => x.Name == name);

    public static async Task<SignalRProbe> ConnectAsync(Uri baseUrl, string token)
    {
        var probe = new SignalRProbe();
        try
        {
            var uri = new UriBuilder(baseUrl) { Scheme = "ws", Path = "/hubs/notification",
                Query = "access_token=" + Uri.EscapeDataString(token) }.Uri;
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            await probe.socket.ConnectAsync(uri, timeout.Token);
            probe.pump = probe.ReadAsync();
            await probe.socket.SendAsync(Encoding.UTF8.GetBytes("{\"protocol\":\"json\",\"version\":1}\u001e"),
                WebSocketMessageType.Text, true, timeout.Token);
            await probe.handshake.Task.WaitAsync(timeout.Token);
            return probe;
        }
        catch
        {
            await probe.DisposeAsync();
            throw;
        }
    }

    private async Task ReadAsync()
    {
        var buffer = new byte[8192];
        using var message = new MemoryStream();
        var pending = "";
        try
        {
            while (!stop.IsCancellationRequested)
            {
                var frame = await socket.ReceiveAsync(buffer, stop.Token);
                if (frame.MessageType == WebSocketMessageType.Close) break;
                message.Write(buffer, 0, frame.Count);
                if (!frame.EndOfMessage) continue;
                pending += Encoding.UTF8.GetString(message.ToArray());
                message.SetLength(0);
                int end;
                while ((end = pending.IndexOf('\u001e')) >= 0)
                {
                    var item = JsonNode.Parse(pending[..end])!;
                    pending = pending[(end + 1)..];
                    if (item["error"] != null) throw new InvalidOperationException("Hub handshake rejected");
                    if (item["type"] == null) handshake.TrySetResult();
                    if (item["target"]?.GetValue<string>() is { } name)
                        Events.Enqueue((name, item["arguments"]![0]!.DeepClone()));
                    if (item["type"]?.GetValue<int>() == 7) return;
                }
            }
        }
        catch (OperationCanceledException) when (stop.IsCancellationRequested) { }
        catch (WebSocketException) { /* Revocation can abort the transport without a close frame. */ }
        catch (Exception ex) { handshake.TrySetException(ex); throw; }
        finally
        {
            handshake.TrySetException(new InvalidOperationException("Hub closed before handshake"));
            closed.TrySetResult();
        }
    }

    public async Task WaitCountAsync(int expected, string name = "DepartmentWorkflowChanged")
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        while (Count(name) < expected) await Task.Delay(20, timeout.Token);
    }

    public Task WaitClosedAsync() => closed.Task.WaitAsync(TimeSpan.FromSeconds(5));

    public async ValueTask DisposeAsync()
    {
        stop.Cancel();
        socket.Abort();
        try { await pump; }
        finally { socket.Dispose(); stop.Dispose(); }
    }
}
