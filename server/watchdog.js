const Investigation = require('./models/Investigation');
const Alert = require('./models/Alert');

const SCORE_CHANGE_THRESHOLD = 5;

async function checkInvestigation(investigation) {
  const response = await fetch('http://localhost:8000/investigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: investigation.propertyAddress }),
    signal: AbortSignal.timeout(600000),
  });

  if (!response.ok) throw new Error(`AI service responded with ${response.status}`);

  // /investigate streams one line of JSON per finished agent. We just
  // need the final combined result here, so read the whole stream and
  // merge every line into one object.
  const text = await response.text();
  const accumulated = {};
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const update = JSON.parse(line);
    Object.assign(accumulated, Object.values(update)[0]);
  }

  const oldScore = investigation.trustScore;
  const newScore = accumulated.trust_score;
  const change = newScore - oldScore;

  if (Math.abs(change) >= SCORE_CHANGE_THRESHOLD) {
    const severity = change <= -15 ? 'critical' : change < 0 ? 'warning' : 'info';
    const direction = change > 0 ? 'improved' : 'dropped';
    await Alert.create({
      userId: investigation.userId,
      investigationId: investigation._id,
      type: 'score_change',
      severity,
      message: `Trust score for ${investigation.propertyAddress} ${direction} from ${oldScore} to ${newScore}`,
      diff: { oldScore, newScore },
    });
  }

  await Investigation.findByIdAndUpdate(investigation._id, {
    trustScore: newScore,
    agentOutputs: {
      rera_status: accumulated.rera_status,
      fraud_status: accumulated.fraud_status,
      document_status: accumulated.document_status,
      rera_score: accumulated.rera_score,
      fraud_score: accumulated.fraud_score,
      document_score: accumulated.document_score,
    },
    report: accumulated.final_report,
  });

  return { oldScore, newScore };
}

async function checkAllMonitoredProperties() {
  const monitored = await Investigation.find({ isMonitored: true, status: 'complete' });
  for (const investigation of monitored) {
    try {
      await checkInvestigation(investigation);
    } catch (err) {
      console.error(`Watchdog check failed for ${investigation._id}:`, err.message);
    }
  }
}

module.exports = { checkInvestigation, checkAllMonitoredProperties };
