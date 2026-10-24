using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json.Nodes;

// Real SignalR JSON protocol over WebSocket; only used by the disposable C8/C9 fixture.
internal sealed class C8C9LiveEvents : IAsyncDisposable
{
    private readonly ClientWebSocket socket = new();
    private readonly CancellationTokenSource stop = new();
    private readonly ConcurrentQueue<(string Name, JsonNode Data)> events = new();
    private readonly TaskCompletionSource ready = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private Task pump = Task.CompletedTask;

    public static async Task<C8C9LiveEvents> ConnectAsync(Uri baseUrl, string token)
    {
        var live = new C8C9LiveEvents();
        try
        {
            var uri = new UriBuilder(baseUrl) { Scheme = "ws", Path = "/hubs/notification", Query = "access_token=" + Uri.EscapeDataString(token) }.Uri;
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            await live.socket.ConnectAsync(uri, timeout.Token);
            await live.socket.SendAsync(Encoding.UTF8.GetBytes("{\"protocol\":\"json\",\"version\":1}\u001e"),
                WebSocketMessageType.Text, true, timeout.Token);
            live.pump = live.ReadAsync();
            await live.ready.Task.WaitAsync(timeout.Token);
            return live;
        }
        catch
        {
            await live.DisposeAsync();
            throw;
        }
    }

    private async Task ReadAsync()
    {
        var buffer = new byte[8192];
        using var frame = new MemoryStream();
        var pending = "";
        try
        {
            while (!stop.IsCancellationRequested)
            {
                var received = await socket.ReceiveAsync(buffer, stop.Token);
                if (received.MessageType == WebSocketMessageType.Close)
                    throw new IOException("C8/C9 SignalR connection closed before the fixture completed");
                frame.Write(buffer, 0, received.Count);
                if (!received.EndOfMessage) continue;
                pending += Encoding.UTF8.GetString(frame.GetBuffer(), 0, checked((int)frame.Length));
                frame.SetLength(0);
                int end;
                while ((end = pending.IndexOf('\u001e')) >= 0)
                {
                    var message = JsonNode.Parse(pending[..end]);
                    pending = pending[(end + 1)..];
                    if (!ready.Task.IsCompleted)
                    {
                        if (message?["error"] != null) throw new IOException("C8/C9 SignalR handshake rejected");
                        ready.TrySetResult();
                    }
                    else if (message?["target"]?.GetValue<string>() is { } name)
                        events.Enqueue((name, message["arguments"]![0]!.DeepClone()));
                }
            }
        }
        catch (OperationCanceledException) when (stop.IsCancellationRequested) { }
        catch (WebSocketException) when (stop.IsCancellationRequested) { }
        catch (Exception error)
        {
            ready.TrySetException(error);
            throw;
        }
    }

    public async Task WaitAsync(string name, string idProperty, int id, string? stateProperty = null, string? state = null)
    {
        var deadline = DateTime.UtcNow.AddSeconds(10);
        while (DateTime.UtcNow < deadline)
        {
            if (pump.IsFaulted) await pump;
            if (events.Any(item => item.Name == name && item.Data[idProperty]?.ToString() == id.ToString()
                && (stateProperty == null || item.Data[stateProperty]?.ToString() == state))) return;
            await Task.Delay(25);
        }
        throw new Exception($"C8/C9 expected {name} {idProperty}={id} {stateProperty}={state}");
    }

    public async ValueTask DisposeAsync()
    {
        stop.Cancel();
        try { await pump; }
        finally { socket.Dispose(); stop.Dispose(); }
    }
}
