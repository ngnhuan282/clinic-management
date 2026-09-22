using System.Collections.Concurrent;

namespace ClinicManagement.Hubs;

// A single API instance owns these connections. Scale-out needs shared revocation delivery.
public sealed class NotificationConnections
{
    private readonly ConcurrentDictionary<string, (int UserId, Action Abort)> _connections = new();
    public void Add(string connectionId, int userId, Action abort) => _connections[connectionId] = (userId, abort);
    public void Remove(string connectionId) => _connections.TryRemove(connectionId, out _);
    public void DisconnectUser(int userId)
    {
        foreach (var connection in _connections.Values.Where(x => x.UserId == userId)) connection.Abort();
    }
}
