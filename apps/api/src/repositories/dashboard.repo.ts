import { Project } from "../models/Project";
import { Run } from "../models/Run";
import { Result } from "../models/Result";

export async function getDashboardSummary() {
  const projectsCount = await Project.countDocuments();

  const runsCount = await Run.countDocuments();

  const byStatusArr = await Run.aggregate([
    { $group: { _id: "$status", c: { $sum: 1 } } },
  ]);

  const byStatus = {
    pending: 0,
    running: 0,
    done: 0,
    failed: 0,
  };

  for (const x of byStatusArr) {
    const k = String(x._id ?? "");
    if (k in byStatus) (byStatus as any)[k] = x.c ?? 0;
  }

  const latestRun = await Run.findOne().sort({ createdAt: -1 }).lean();
  const latestDoneRun = await Run.findOne({ status: "done" }).sort({ createdAt: -1 }).lean();

  // Top contributors lấy theo run done gần nhất để dashboard luôn có dữ liệu tham chiếu.
  let topContributors: any[] = [];
  if (latestDoneRun) {
    topContributors = await Result.find({ runId: latestDoneRun._id })
      .sort({ scoreTotal: -1 })
      .limit(5)
      .lean();
  }

  return {
    projectsCount,
    runsCount,
    statusCounts: byStatus,
    latestRun,
    latestDoneRun,
    topContributors,
  };
}
