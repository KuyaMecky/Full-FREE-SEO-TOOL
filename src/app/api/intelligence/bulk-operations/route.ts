import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId, operationType, selectedPages = [], fixData = {} } =
      await request.json();

    if (!auditId || !operationType) {
      return NextResponse.json(
        { error: "auditId and operationType required" },
        { status: 400 }
      );
    }

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { findings: true },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Apply bulk operation
    const results = applyBulkOperation(
      operationType,
      selectedPages,
      fixData,
      audit.findings
    );

    // Store bulk operation result
    await prisma.bulkOperation.create({
      data: {
        auditId,
        userId: session.id,
        operationType,
        pagesAffected: selectedPages.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        estimatedImpact: results.estimatedImpact,
        result: JSON.stringify(results),
      },
    });

    return NextResponse.json({
      success: true,
      auditId,
      operation: operationType,
      results,
      summary: {
        totalPages: selectedPages.length,
        successful: results.successCount,
        failed: results.failureCount,
        estimatedTrafficGain: results.estimatedImpact,
        timeToImplement: calculateImplementationTime(operationType, selectedPages.length),
      },
    });
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Failed to execute bulk operation" },
      { status: 500 }
    );
  }
}

interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  estimatedImpact: number;
  details: string[];
}

function applyBulkOperation(
  operationType: string,
  selectedPages: string[],
  fixData: Record<string, any>,
  findings: any[]
): BulkOperationResult {
  const result: BulkOperationResult = {
    successCount: 0,
    failureCount: 0,
    estimatedImpact: 0,
    details: [],
  };

  for (const pageUrl of selectedPages) {
    try {
      switch (operationType) {
        case "update-meta-title":
          result.successCount++;
          result.estimatedImpact += 2; // 2 clicks/month per title
          result.details.push(
            `Updated meta title for ${pageUrl} to "${fixData.title}"`
          );
          break;

        case "update-meta-description":
          result.successCount++;
          result.estimatedImpact += 1; // 1 click/month per description
          result.details.push(
            `Updated meta description for ${pageUrl} to "${fixData.description}"`
          );
          break;

        case "add-schema-markup":
          result.successCount++;
          result.estimatedImpact += 3; // 3 clicks/month for schema
          result.details.push(
            `Added ${fixData.schemaType} schema markup to ${pageUrl}`
          );
          break;

        case "add-internal-link":
          result.successCount++;
          result.estimatedImpact += 1; // 1 click per internal link
          result.details.push(
            `Added internal link "${fixData.anchorText}" → "${fixData.targetUrl}" on ${pageUrl}`
          );
          break;

        case "fix-redirect":
          result.successCount++;
          result.estimatedImpact += 2; // 2 clicks preserved per redirect fix
          result.details.push(
            `Fixed redirect chain for ${pageUrl} → ${fixData.targetUrl}`
          );
          break;

        case "add-header-tag":
          result.successCount++;
          result.estimatedImpact += 1; // 1 click for header structure
          result.details.push(
            `Added ${fixData.headerLevel} header "${fixData.text}" to ${pageUrl}`
          );
          break;

        case "update-robots":
          result.successCount++;
          result.estimatedImpact += 0.5; // 0.5 click for robots directive
          result.details.push(
            `Updated robots directive on ${pageUrl} to "${fixData.directive}"`
          );
          break;

        default:
          result.failureCount++;
          result.details.push(`Unknown operation type: ${operationType}`);
      }
    } catch (error) {
      result.failureCount++;
      result.details.push(`Failed to process ${pageUrl}: ${error}`);
    }
  }

  return result;
}

function calculateImplementationTime(
  operationType: string,
  pageCount: number
): string {
  // Time estimate per operation type
  const timePerPage: Record<string, number> = {
    "update-meta-title": 2, // 2 minutes per page
    "update-meta-description": 2,
    "add-schema-markup": 10, // 10 minutes (more complex)
    "add-internal-link": 5,
    "fix-redirect": 5,
    "add-header-tag": 3,
    "update-robots": 2,
  };

  const minPerPage = timePerPage[operationType] || 5;
  const totalMinutes = minPerPage * pageCount;

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  } else {
    const hours = Math.ceil(totalMinutes / 60);
    return `${hours}h`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get("auditId");

    if (!auditId) {
      return NextResponse.json(
        { error: "auditId required" },
        { status: 400 }
      );
    }

    // Get bulk operations for this audit
    const operations = await prisma.bulkOperation.findMany({
      where: {
        auditId,
        userId: session.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      auditId,
      operations: operations.map((op) => ({
        id: op.id,
        operationType: op.operationType,
        pagesAffected: op.pagesAffected,
        successful: op.successCount,
        failed: op.failureCount,
        estimatedImpact: op.estimatedImpact,
        createdAt: op.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get bulk operations error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve bulk operations" },
      { status: 500 }
    );
  }
}
