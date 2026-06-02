import API_URL from '../config/api';

class SlicesAPI {
  async getSlices() {
    const response = await fetch(`${API_URL}/slices`);
    if (!response.ok) throw new Error('Error fetching slices');
    return response.json();
  }

  async getSlice(sliceName) {
    const response = await fetch(`${API_URL}/slices/${sliceName}`);
    if (!response.ok) throw new Error(`Slice not found: ${sliceName}`);
    return response.json();
  }

  async deployLinear(sliceName, numVMs, vlanId, vlanCIDR, startVncPort) {
    const response = await fetch(`${API_URL}/slices/deploy/linear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sliceName,
        numVMs,
        vlanId,
        vlanCIDR,
        startVncPort
      })
    });
    if (!response.ok) throw new Error('Error deploying linear slice');
    return response.json();
  }

  async deployRing(sliceName, numVMs, vlanId, vlanCIDR, startVncPort) {
    const response = await fetch(`${API_URL}/slices/deploy/ring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sliceName,
        numVMs,
        vlanId,
        vlanCIDR,
        startVncPort
      })
    });
    if (!response.ok) throw new Error('Error deploying ring slice');
    return response.json();
  }

  async destroySlice(sliceName) {
    const response = await fetch(`${API_URL}/slices/${sliceName}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Error destroying slice: ${sliceName}`);
    return response.json();
  }

  async health() {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  }
}

export default new SlicesAPI();
